import axios from "axios";

export function createAuthApi({
	authTokens,
	setAuthTokens,
	logoutUser,
	refreshPath = "/api/accounts/token/refresh/",
}) {
	const instance = axios.create({
		baseURL: "http://127.0.0.1:8000",
		headers: { "Content-Type": "application/json" },
	});

	instance.interceptors.request.use(
		(config) => {
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
					`http://127.0.0.1:8000${refreshPath}`,
					{ refresh },
					{ headers: { "Content-Type": "application/json" } },
				);

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
