import axios from "axios";
import { createApiClient, normalizeApiError } from "../api/client";

const { instance, responseErrors } = vi.hoisted(() => ({
	instance: vi.fn((config) => Promise.resolve({ config })),
	responseErrors: [],
}));

vi.mock("axios", () => ({
	default: { create: vi.fn(() => instance) },
}));

beforeEach(() => {
	vi.clearAllMocks();
	responseErrors.length = 0;
	instance.interceptors = {
		response: {
			use: vi.fn((success, error) => responseErrors.push(error)),
		},
	};
});

test("configures a finite request timeout", () => {
	createApiClient();

	expect(axios.create).toHaveBeenCalledWith(expect.objectContaining({
		timeout: 10000,
		withCredentials: true,
	}));
});

test("retries a safe request twice for transient failures", async () => {
	createApiClient({ maxRetries: 2, retryDelayMs: 0 });
	const retry = responseErrors[0];
	const error = { config: { method: "get" }, response: { status: 503 } };

	await retry(error);
	await retry(error);
	await expect(retry(error)).rejects.toBe(error);

	expect(instance).toHaveBeenCalledTimes(2);
});

test("never automatically retries a write request", async () => {
	createApiClient({ retryDelayMs: 0 });
	const error = { config: { method: "post" }, response: { status: 503 } };

	await expect(responseErrors[0](error)).rejects.toBe(error);
	expect(instance).not.toHaveBeenCalled();
});

test("normalizes server, timeout, and network failures", () => {
	expect(normalizeApiError({
		response: {
			status: 429,
			headers: { "retry-after": "30" },
			data: { error: { code: "rate_limit_exceeded", message: "Slow down.", details: null } },
		},
	})).toEqual(expect.objectContaining({
		code: "rate_limit_exceeded",
		message: "Slow down.",
		status: 429,
		retryAfter: "30",
	}));
	expect(normalizeApiError({ code: "ECONNABORTED" }).code).toBe("timeout");
	expect(normalizeApiError(new Error("offline")).code).toBe("network_error");
});
