import axios from "axios";
import { API_BASE_URL } from "../config";
import { API_CLIENT_CONFIG, createApiClient } from "./client";

export function createAuthApi({
	setAuthTokens,
	onUnauthorized,
	refreshPath = "/api/accounts/token/refresh/",
}) {
	const instance = createApiClient();
	let refreshPromise = null;

	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;

			if (!error.response) return Promise.reject(error);
			if (error.response.status !== 401) return Promise.reject(error);

			// Mark the request before refreshing so a rejected replay cannot enter an
			// infinite refresh loop.
			if (!originalRequest || originalRequest._authRetried) {
				onUnauthorized?.();
				return Promise.reject(error);
			}
			originalRequest._authRetried = true;

			try {
				if (!refreshPromise) {
					refreshPromise = axios.post(`${API_BASE_URL}${refreshPath}`, {}, API_CLIENT_CONFIG)
						.finally(() => { refreshPromise = null; });
				}
				await refreshPromise;
				setAuthTokens?.({ access: true });

				return instance(originalRequest);
			} catch (refreshErr) {
				onUnauthorized?.();
				return Promise.reject(refreshErr);
			}
		},
	);

	return instance;
}
