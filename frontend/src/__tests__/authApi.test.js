import axios from "axios";
import { createAuthApi } from "../api/authApi";

const { handlers, instance } = vi.hoisted(() => ({
	handlers: {},
	instance: vi.fn((config) => Promise.resolve({ replayed: config })),
}));

vi.mock("axios", () => ({
	default: {
		create: vi.fn(() => instance),
		post: vi.fn(),
	},
}));

beforeEach(() => {
	vi.clearAllMocks();
	Object.assign(handlers, {
		requestSuccess: null,
		requestError: null,
		responseSuccess: null,
		responseError: null,
	});
	instance.interceptors = {
		request: {
			use: vi.fn((success, error) => {
				handlers.requestSuccess = success;
				handlers.requestError = error;
			}),
		},
		response: {
			use: vi.fn((success, error) => {
				handlers.responseSuccess = success;
				handlers.responseError = error;
			}),
		},
	};
});

test("adds the access token to protected requests", () => {
	createAuthApi({ authTokens: { access: "access-token" } });

	const config = handlers.requestSuccess({ headers: {} });

	expect(config.headers.Authorization).toBe("Bearer access-token");
});

test("refreshes once and replays a rejected request", async () => {
	const setAuthTokens = vi.fn();
	axios.post.mockResolvedValue({ data: { access: "new-access" } });
	createAuthApi({
		authTokens: { access: "old-access", refresh: "refresh-token" },
		setAuthTokens,
		logoutUser: vi.fn(),
	});
	const originalRequest = { headers: {} };

	await handlers.responseError({
		config: originalRequest,
		response: { status: 401 },
	});

	expect(axios.post).toHaveBeenCalledWith(
		expect.stringMatching(/\/api\/accounts\/token\/refresh\/$/),
		{ refresh: "refresh-token" },
		expect.any(Object),
	);
	expect(setAuthTokens).toHaveBeenCalledWith({
		access: "new-access",
		refresh: "refresh-token",
	});
	expect(originalRequest.headers.Authorization).toBe("Bearer new-access");
	expect(instance).toHaveBeenCalledWith(originalRequest);
});

test("logs out instead of retrying forever", async () => {
	const logoutUser = vi.fn();
	createAuthApi({ authTokens: { refresh: "refresh-token" }, logoutUser });
	const error = {
		config: { _retry: true },
		response: { status: 401 },
	};

	await expect(handlers.responseError(error)).rejects.toBe(error);
	expect(logoutUser).toHaveBeenCalledOnce();
	expect(axios.post).not.toHaveBeenCalled();
});

test("does not refresh non-authentication failures", async () => {
	createAuthApi({ authTokens: { refresh: "refresh-token" } });
	const error = { config: {}, response: { status: 500 } };

	await expect(handlers.responseError(error)).rejects.toBe(error);
	expect(axios.post).not.toHaveBeenCalled();
});
