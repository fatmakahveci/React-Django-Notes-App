import axios from "axios";
import { API_BASE_URL } from "../config";

export function createAuthApi({
	authTokens,
	setAuthTokens,
	logoutUser,
	refreshPath = "/api/accounts/token/refresh/",
}) {
	const instance = axios.create({
		baseURL: API_BASE_URL,
		headers: { "Content-Type": "application/json" },
	});

	instance.interceptors.request.use(
		(config) => {
			// Read the token supplied when this client was created and attach it to
			// every protected API request.
			const access = authTokens?.access;
			if (access) {
				config.headers = config.headers || {};
				config.headers.Authorization = `Bearer ${access}`;
			}
			return config;
		},
		(error) => Promise.reject(error),
	);

	instance.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;

			if (!error.response) return Promise.reject(error);
			if (error.response.status !== 401) return Promise.reject(error);

			// Mark the request before refreshing so a rejected replay cannot enter an
			// infinite refresh loop.
			if (originalRequest._retry) {
				logoutUser?.();
				return Promise.reject(error);
			}
			originalRequest._retry = true;

			const refresh = authTokens?.refresh;
			if (!refresh) {
				logoutUser?.();
				return Promise.reject(error);
			}

			try {
				const refreshRes = await axios.post(
					`${API_BASE_URL}${refreshPath}`,
					{ refresh },
					{ headers: { "Content-Type": "application/json" } },
				);

				// SimpleJWT may rotate the refresh token, so retain old fields while
				// replacing everything returned by the refresh endpoint.
				const newTokens = { ...authTokens, ...refreshRes.data };
				setAuthTokens(newTokens);

				originalRequest.headers = originalRequest.headers || {};
				originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;

				return instance(originalRequest);
			} catch (refreshErr) {
				logoutUser?.();
				return Promise.reject(refreshErr);
			}
		},
	);

	return instance;
}
