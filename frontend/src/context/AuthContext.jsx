import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import { normalizeApiError } from "../api/client";

const AuthContext = createContext(null);

const TOKEN_URL = "/api/accounts/token/";
const REFRESH_URL = "/api/accounts/token/refresh/";
const REGISTER_URL = "/api/accounts/register/";
const SESSION_URL = "/api/accounts/session/";
const LOGOUT_URL = "/api/accounts/logout/";
const CSRF_URL = "/api/accounts/csrf/";

export const AuthProvider = ({ children }) => {
	const [authTokens, setAuthTokens] = useState(null);
	const [user, setUser] = useState(null);
	const [loadingAuth, setLoadingAuth] = useState(true);
	const [authError, setAuthError] = useState("");

	const markAuthenticated = useCallback(() => setAuthTokens({ access: true }), []);
	const clearAuth = useCallback(() => {
		setAuthTokens(null);
		setUser(null);
	}, []);

	const ensureCsrfCookie = useCallback(() => api.get(CSRF_URL), []);

	const loadSession = useCallback(async () => {
		const response = await api.get(SESSION_URL);
		setUser(response.data.user);
		markAuthenticated();
		return true;
	}, [markAuthenticated]);

	const refreshAccessToken = useCallback(async () => {
		try {
			await api.post(REFRESH_URL, {});
			markAuthenticated();
			return true;
		} catch {
			clearAuth();
			return false;
		}
	}, [markAuthenticated, clearAuth]);

	const logoutUser = useCallback(async () => {
		try {
			await ensureCsrfCookie();
			await api.post(LOGOUT_URL, {});
		} finally {
			clearAuth();
		}
	}, [ensureCsrfCookie, clearAuth]);

	const loginUser = useCallback(async (event) => {
		event.preventDefault();
		setAuthError("");
		try {
			await ensureCsrfCookie();
			const response = await api.post(TOKEN_URL, {
				email: event.target.email.value,
				password: event.target.password.value,
			});
			setUser(response.data.user);
			markAuthenticated();
		} catch (error) {
			clearAuth();
			setAuthError(normalizeApiError(error, "Login failed. Check your email and password.").message);
		}
	}, [ensureCsrfCookie, markAuthenticated, clearAuth]);

	const registerUser = useCallback(async (payload) => {
		try {
			await ensureCsrfCookie();
			await api.post(REGISTER_URL, payload);
			return { ok: true };
		} catch (error) {
			const normalized = normalizeApiError(error, "Registration failed.");
			const message =
				normalized.details?.email?.[0] ||
				normalized.details?.user_name?.[0] ||
				normalized.details?.password?.[0] ||
				normalized.details?.match_password?.[0] ||
				normalized.message;
			return { ok: false, error: String(message) };
		}
	}, [ensureCsrfCookie]);

	useEffect(() => {
		const initialize = async () => {
			try {
				await ensureCsrfCookie();
				await loadSession();
			} catch {
				if (await refreshAccessToken()) {
					try {
						await loadSession();
					} catch {
						clearAuth();
					}
				}
			} finally {
				setLoadingAuth(false);
			}
		};
		initialize();
	}, [ensureCsrfCookie, loadSession, refreshAccessToken, clearAuth]);

	useEffect(() => {
		if (!authTokens?.access) return undefined;
		const interval = setInterval(refreshAccessToken, 1000 * 60 * 4);
		return () => clearInterval(interval);
	}, [authTokens, refreshAccessToken]);

	const contextValue = useMemo(() => ({
		user,
		authTokens,
		setAuthTokens: markAuthenticated,
		loginUser,
		logoutUser,
		clearAuth,
		registerUser,
		authError,
		loadingAuth,
	}), [user, authTokens, markAuthenticated, loginUser, logoutUser, clearAuth, registerUser, authError, loadingAuth]);

	return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext;
