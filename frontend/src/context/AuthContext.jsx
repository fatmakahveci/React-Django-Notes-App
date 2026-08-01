import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const TOKEN_URL = "/api/accounts/token/";
const REFRESH_URL = "/api/accounts/token/refresh/";
const REGISTER_URL = "/api/accounts/register/";

const decodeJwtPayload = (token) => {
	try {
		// Decoding is only for client-side display/state. Token authenticity is
		// still verified by Django on every protected request.
		const payload = token.split(".")[1];
		const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
		const json = decodeURIComponent(
			atob(base64)
				.split("")
				.map(
					(c) =>
						`%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`,
				)
				.join(""),
		);
		return JSON.parse(json);
	} catch {
		return null;
	}
};

export const AuthProvider = ({ children }) => {
	const [authTokens, setAuthTokens] = useState(() => {
		const stored = localStorage.getItem("authTokens");
		return stored ? JSON.parse(stored) : null;
	});

	const [user, setUser] = useState(() => {
		const stored = localStorage.getItem("authTokens");
		if (!stored) return null;
		const tokens = JSON.parse(stored);
		const payload = tokens?.access ? decodeJwtPayload(tokens.access) : null;
		return payload || null;
	});

	const [loadingAuth, setLoadingAuth] = useState(true);
	const [authError, setAuthError] = useState("");

	const persistTokens = useCallback((tokens) => {
		setAuthTokens(tokens);
		localStorage.setItem("authTokens", JSON.stringify(tokens));
		const payload = tokens?.access ? decodeJwtPayload(tokens.access) : null;
		setUser(payload || null);
	}, []);

	const clearAuth = useCallback(() => {
		setAuthTokens(null);
		setUser(null);
		localStorage.removeItem("authTokens");
	}, []);

	const logoutUser = useCallback(() => {
		clearAuth();
	}, [clearAuth]);

	const loginUser = useCallback(
		async (e) => {
			e.preventDefault();
			setAuthError("");

			const email = e.target.email.value;
			const password = e.target.password.value;

			try {
				const res = await api.post(TOKEN_URL, { email, password });
				// Expected: { access, refresh }
				persistTokens(res.data);
			} catch (err) {
				clearAuth();
				setAuthError("Login failed. Check your email and password.");
			}
		},
		[persistTokens, clearAuth],
	);

	const registerUser = useCallback(
		async ({ email, user_name, password, match_password }) => {
			try {
				await api.post(REGISTER_URL, {
					email,
					user_name,
					password,
					match_password,
				});
				return { ok: true };
			} catch (err) {
				const msg =
					err?.response?.data?.email?.[0] ||
					err?.response?.data?.user_name?.[0] ||
					err?.response?.data?.password?.[0] ||
					err?.response?.data?.match_password?.[0] ||
					err?.response?.data?.detail ||
					"Registration failed.";
				return { ok: false, error: String(msg) };
			}
		},
		[],
	);

	const refreshAccessToken = useCallback(async () => {
		const refresh = authTokens?.refresh;
		if (!refresh) {
			clearAuth();
			return false;
		}

		try {
			const res = await api.post(REFRESH_URL, { refresh });

			// Some setups rotate refresh tokens; keep it if the API returns it
			const newTokens = {
				...authTokens,
				...res.data, // usually { access } or { access, refresh }
			};

			persistTokens(newTokens);
			return true;
		} catch {
			clearAuth();
			return false;
		}
	}, [authTokens, persistTokens, clearAuth]);

	// On app start: if we have tokens, refresh once to ensure we don't log out quickly
	useEffect(() => {
		const init = async () => {
			if (authTokens?.refresh) {
				await refreshAccessToken();
			}
			setLoadingAuth(false);
		};
		init();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refresh periodically (prevents “kicked out after a short time”)
	useEffect(() => {
		if (!authTokens?.refresh) return;

		const interval = setInterval(
			() => {
				refreshAccessToken();
			},
			1000 * 60 * 4,
		); // every 4 minutes

		return () => clearInterval(interval);
	}, [authTokens, refreshAccessToken]);

	const contextValue = useMemo(
		() => ({
			user,
			authTokens,
			setAuthTokens: persistTokens, // keep a setter-like API
			loginUser,
			logoutUser,
			registerUser,
			authError,
			loadingAuth,
		}),
		[
			user,
			authTokens,
			persistTokens,
			loginUser,
			logoutUser,
			registerUser,
			authError,
			loadingAuth,
		],
	);

	return (
		<AuthContext.Provider value={contextValue}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
