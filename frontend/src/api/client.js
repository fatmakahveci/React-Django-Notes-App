import axios from "axios";
import { API_BASE_URL, API_TIMEOUT_MS } from "../config";

const SAFE_RETRY_METHODS = new Set(["get", "head", "options"]);
const RETRYABLE_STATUS_CODES = new Set([502, 503, 504]);

export const API_CLIENT_CONFIG = {
	baseURL: API_BASE_URL,
	timeout: API_TIMEOUT_MS,
	withCredentials: true,
	xsrfCookieName: "csrftoken",
	xsrfHeaderName: "X-CSRFToken",
	headers: { "Content-Type": "application/json" },
};

export function normalizeApiError(error, fallback = "The request failed.") {
	const status = error?.response?.status ?? null;
	const serverError = error?.response?.data?.error;
	const isTimeout = error?.code === "ECONNABORTED" || error?.code === "ETIMEDOUT";
	const isNetworkError = !error?.response && !isTimeout;

	let message = serverError?.message || fallback;
	if (isTimeout) message = "The request timed out. Please try again.";
	else if (isNetworkError) message = "Unable to reach the server. Check your connection.";

	return {
		code: serverError?.code || (isTimeout ? "timeout" : isNetworkError ? "network_error" : "api_error"),
		message: String(message),
		status,
		details: serverError?.details ?? null,
		retryAfter: error?.response?.headers?.["retry-after"] ?? null,
		isTimeout,
		isNetworkError,
	};
}

export function shouldRetry(error) {
	const method = error?.config?.method?.toLowerCase();
	if (!SAFE_RETRY_METHODS.has(method)) return false;
	if (!error?.response) return error?.code !== "ERR_CANCELED";
	return RETRYABLE_STATUS_CODES.has(error.response.status);
}

export function createApiClient({ maxRetries = 2, retryDelayMs = 250 } = {}) {
	const instance = axios.create(API_CLIENT_CONFIG);

	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const config = error?.config;
			if (!config || !shouldRetry(error)) return Promise.reject(error);

			config._retryCount = config._retryCount || 0;
			if (config._retryCount >= maxRetries) return Promise.reject(error);
			config._retryCount += 1;

			const delay = retryDelayMs * config._retryCount;
			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}
			return instance(config);
		},
	);

	return instance;
}
