import api from "./axios";

/**
 * Creates an authenticated axios client that:
 * - attaches the access token on every request
 * - refreshes the access token on 401 once, then retries the original request
 *
 * You must pass:
 * - authTokens: { access, refresh }
 * - setAuthTokens: function to update tokens in state
 * - logoutUser: function to log out (optional but recommended)
 * - refreshPath: refresh endpoint path (default: "/api/token/refresh/")
 */
export const createAuthApi = ({
	authTokens,
	setAuthTokens,
	logoutUser,
	refreshPath = "/api/accounts/token/refresh/",
}) => {
	const authApi = api;

	authApi.interceptors.request.use(
		(config) => {
			if (authTokens?.access) {
				config.headers.Authorization = `Bearer ${authTokens.access}`;
			}
			return config;
		},
		(error) => Promise.reject(error),
	);

	authApi.interceptors.response.use(
		(response) => response,
		async (error) => {
			const originalRequest = error.config;

			if (error.response?.status === 401 && !originalRequest?._retry) {
				originalRequest._retry = true;

				try {
					const refresh = authTokens?.refresh;
					if (!refresh) throw new Error("Missing refresh token");

					const res = await api.post(refreshPath, { refresh });
					const newAccess = res.data?.access;
					if (!newAccess)
						throw new Error("Refresh did not return access token");

					const newTokens = { ...authTokens, access: newAccess };
					setAuthTokens(newTokens);
					localStorage.setItem(
						"authTokens",
						JSON.stringify(newTokens),
					);

					originalRequest.headers.Authorization = `Bearer ${newAccess}`;
					return authApi(originalRequest);
				} catch (refreshErr) {
					logoutUser?.();
					return Promise.reject(refreshErr);
				}
			}

			return Promise.reject(error);
		},
	);

	return authApi;
};
