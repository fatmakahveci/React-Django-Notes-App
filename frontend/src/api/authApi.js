import axios from "axios";
import { API_BASE_URL } from "../config";

export function createAuthApi({
	setAuthTokens,
	logoutUser,
	refreshPath = "/api/accounts/token/refresh/",
}) {
	const instance = axios.create({
		baseURL: API_BASE_URL,
		withCredentials: true,
		xsrfCookieName: "csrftoken",
		xsrfHeaderName: "X-CSRFToken",
		headers: { "Content-Type": "application/json" },
	});

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

			try {
				const refreshRes = await axios.post(
					`${API_BASE_URL}${refreshPath}`,
					{},
					{
						withCredentials: true,
						xsrfCookieName: "csrftoken",
						xsrfHeaderName: "X-CSRFToken",
					},
				);
				setAuthTokens({ access: true });

				return instance(originalRequest);
			} catch (refreshErr) {
				logoutUser?.();
				return Promise.reject(refreshErr);
			}
		},
	);

	return instance;
}
