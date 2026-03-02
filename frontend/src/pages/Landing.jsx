import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import "./landing.css";

const Landing = () => {
	const navigate = useNavigate();
	const { authTokens, user, logoutUser } = useContext(AuthContext);

	const isAuthed = Boolean(authTokens?.access);

	const handleLogout = () => {
		logoutUser();
		navigate("/", { replace: true });
	};

	return (
		<div className="lp-page">
			<div className="lp-shell">
				<header className="lp-top">
					<div className="lp-brand">Notes</div>

					{isAuthed ? (
						<div className="lp-actions">
							<Link className="lp-btn lp-btnPrimary" to="/notes">
								Go to notes
							</Link>
							<button
								className="lp-btn lp-btnGhost"
								onClick={handleLogout}
							>
								Logout
							</button>
						</div>
					) : (
						<div className="lp-actions">
							<Link className="lp-btn lp-btnGhost" to="/login">
								Sign in
							</Link>
							<Link
								className="lp-btn lp-btnPrimary"
								to="/register"
							>
								Create account
							</Link>
						</div>
					)}
				</header>

				<main className="lp-hero">
					<h1 className="lp-title">Write fast. Stay organized.</h1>
					<p className="lp-subtitle">
						A clean notes app with autosave and secure sign-in.
					</p>

					{isAuthed ? (
						<div className="lp-heroCta">
							<div className="lp-welcome">
								Signed in
								{user?.user_name ? ` as ${user.user_name}` : ""}
								.
							</div>
							<Link
								className="lp-btn lp-btnPrimary lp-btnLarge"
								to="/notes"
							>
								Open my notes
							</Link>
						</div>
					) : (
						<div className="lp-heroCta">
							<Link
								className="lp-btn lp-btnPrimary lp-btnLarge"
								to="/register"
							>
								Get started
							</Link>
							<Link
								className="lp-btn lp-btnGhost lp-btnLarge"
								to="/login"
							>
								I already have an account
							</Link>
						</div>
					)}
				</main>
			</div>
		</div>
	);
};

export default Landing;
