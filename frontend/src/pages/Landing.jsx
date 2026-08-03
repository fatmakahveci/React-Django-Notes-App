import { useContext } from "react";
import { Link, useNavigate } from "../router";
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

				<section className="lp-preview" aria-labelledby="product-preview-title">
					<div className="lp-previewCopy">
						<h2 id="product-preview-title">Your notes, clear at a glance</h2>
						<p>Search, organize, and continue writing from any screen size.</p>
					</div>
					<figure className="lp-previewFrame">
						<picture>
							<source
								type="image/webp"
								srcSet="/images/notes-demo-480.webp 480w, /images/notes-demo-768.webp 768w, /images/notes-demo-1200.webp 1200w"
								sizes="(max-width: 520px) calc(100vw - 28px), (max-width: 1100px) calc(100vw - 40px), 1040px"
							/>
							<img
								src="/images/notes-demo-1200.png"
								alt="Notes dashboard showing searchable note cards"
								width="1200"
								height="782"
								loading="lazy"
								decoding="async"
								fetchpriority="low"
							/>
						</picture>
						<figcaption>A demo account with fictional content.</figcaption>
					</figure>
				</section>
			</div>
		</div>
	);
};

export default Landing;
