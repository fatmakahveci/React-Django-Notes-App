import { useContext, useEffect, useState } from "react";
import { useSearchParams } from "wouter";
import { Link, useNavigate } from "../router";
import AuthContext from "../context/AuthContext";
import "./login.css";

const Login = () => {
	const { loginUser, authError, authTokens } = useContext(AuthContext);
	const navigate = useNavigate();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	
	const [searchParams] = useSearchParams();

	useEffect(() => {
		const registeredEmail = searchParams.get("email");
		if (registeredEmail) {
			setEmail(registeredEmail);
		}
	}, [searchParams]);

	useEffect(() => {
		if (authTokens?.access) {
			navigate("/notes", { replace: true });
		}
	}, [authTokens, navigate]);

	const handleSubmit = async (e) => {
		await loginUser(e);
	};

	return (
		<div className="login-page">
			<div className="login-card">
				<Link to="/" className="login-brandLink">
					Notes
				</Link>

				<h1 className="login-title">Welcome back</h1>
				<p className="login-subtitle">
					Sign in to continue to your notes
				</p>

				{authError ? (
					<div className="login-error" role="alert">{authError}</div>
				) : null}

				<form onSubmit={handleSubmit} className="login-form">
					<div className="login-field">
						<label htmlFor="login-email">Email</label>
						<input
							id="login-email"
							type="email"
							name="email"
							autoComplete="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>

					<div className="login-field">
						<label htmlFor="login-password">Password</label>
						<input
							id="login-password"
							type="password"
							name="password"
							autoComplete="current-password"
							placeholder="Your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
					</div>

					<button type="submit" className="login-button">
						Sign in
					</button>
				</form>

				<div className="login-footer">
					<div>
						Don’t have an account?{" "}
						<Link to="/register">Create account</Link>
					</div>

					<div style={{ marginTop: 10 }}>
						<Link to="/" className="login-homeLink">
							← Back to home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
