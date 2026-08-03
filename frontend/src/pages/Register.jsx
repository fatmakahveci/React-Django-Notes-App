import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "../router";
import AuthContext from "../context/AuthContext";
import api from "../api/axios";
import { normalizeApiError } from "../api/client";
import { passwordMeetsPolicy } from "../auth/passwordPolicy";
import "./login.css";

const USERNAME_REGEX = /^[a-zA-Z][a-zA-Z0-9-_]{3,23}$/;
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
const PASSWORD_POLICY_URL = "/api/accounts/password-policy/";

const Register = () => {
	const navigate = useNavigate();
	const { registerUser, authTokens } = useContext(AuthContext);

	const [email, setEmail] = useState("");
	const [userName, setUserName] = useState("");
	const [pwd, setPwd] = useState("");
	const [matchPwd, setMatchPwd] = useState("");

	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [touched, setTouched] = useState(false);
	const [passwordPolicy, setPasswordPolicy] = useState(null);

	useEffect(() => {
		let active = true;
		api.get(PASSWORD_POLICY_URL)
			.then((response) => { if (active) setPasswordPolicy(response.data); })
			.catch((requestError) => {
				if (active) setError(normalizeApiError(requestError, "Unable to load password requirements.").message);
			});
		return () => { active = false; };
	}, []);

	// Redirect if already logged in
	useEffect(() => {
		if (authTokens?.access) {
			navigate("/notes", { replace: true });
		}
	}, [authTokens, navigate]);

	// Validation
	const validEmail = useMemo(() => EMAIL_REGEX.test(email), [email]);
	const validUserName = useMemo(
		() => USERNAME_REGEX.test(userName),
		[userName],
	);
	const validPwd = useMemo(
		() => passwordMeetsPolicy(pwd, passwordPolicy),
		[pwd, passwordPolicy],
	);
	const validMatch = useMemo(
		() => pwd === matchPwd && matchPwd.length > 0,
		[pwd, matchPwd],
	);

	const canSubmit =
		validEmail && validUserName && validPwd && validMatch && !busy;

	const handleSubmit = async (e) => {
		e.preventDefault();
		setTouched(true);
		setError("");

		if (!canSubmit) return;

		setBusy(true);

		const result = await registerUser({
			email,
			user_name: userName,
			password: pwd,
			match_password: matchPwd,
		});

		setBusy(false);

		if (!result?.ok) {
			setError(result?.error || "Registration failed.");
			return;
		}

		// Success → go to login with email prefilled
		navigate(`/login?email=${encodeURIComponent(email)}`, { replace: true });
	};

	return (
		<main className="login-page">
			<div className="login-card">
				<Link to="/" className="login-brandLink">
					Notes
				</Link>

				<h1 className="login-title">Create your account</h1>
				<p className="login-subtitle">Start writing in seconds</p>

				{error && <div className="login-error" role="alert">{error}</div>}

				<form onSubmit={handleSubmit} className="login-form">
					<fieldset
						disabled={busy}
						style={{ border: 0, padding: 0, margin: 0 }}
					>
						<div className="login-field">
							<label htmlFor="register-username">Username</label>
							<input
								id="register-username"
								name="username"
								type="text"
								autoComplete="username"
								placeholder="yourname"
								value={userName}
								onChange={(e) => setUserName(e.target.value)}
								required
							/>
							{touched && !validUserName && (
								<div className="login-hint">
									4–24 characters. Must start with a letter.
									Letters, numbers, _ and - allowed.
								</div>
							)}
						</div>

						<div className="login-field">
							<label htmlFor="register-email">Email</label>
							<input
								id="register-email"
								name="email"
								type="email"
								autoComplete="email"
								placeholder="you@example.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
							{touched && !validEmail && (
								<div className="login-hint">
									Enter a valid email address.
								</div>
							)}
						</div>

						<div className="login-field">
							<label htmlFor="register-password">Password</label>
							<input
								id="register-password"
								name="password"
								type="password"
								placeholder="At least 8 characters"
								autoComplete="new-password"
								maxLength={passwordPolicy?.max_length}
								value={pwd}
								onChange={(e) => setPwd(e.target.value)}
								required
							/>
							{touched && !validPwd && (
								<div className="login-hint">
									{passwordPolicy?.requirements?.join(" ") || "Loading password requirements..."}
								</div>
							)}
						</div>

						<div className="login-field">
							<label htmlFor="register-password-confirm">Confirm password</label>
							<input
								id="register-password-confirm"
								name="match_password"
								type="password"
								autoComplete="new-password"
								placeholder="Repeat password"
								value={matchPwd}
								onChange={(e) => setMatchPwd(e.target.value)}
								required
							/>
							{touched && !validMatch && (
								<div className="login-hint">
									Passwords must match.
								</div>
							)}
						</div>
					</fieldset>

					<button
						type="submit"
						className="login-button"
						disabled={!canSubmit}
					>
						{busy ? "Creating..." : "Create account"}
					</button>
				</form>

				<div className="login-footer">
					Already have an account? <Link to="/login">Sign in</Link>
				</div>
			</div>
		</main>
	);
};

export default Register;
