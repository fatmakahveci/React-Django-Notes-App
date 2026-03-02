import React from "react";
import { Link } from "react-router-dom";
import "./landing.css";

const Landing = () => {
	return (
		<div className="lp-page">
			<header className="lp-nav">
				<div className="lp-brand">Notes</div>

				<div className="lp-navActions">
					<Link className="lp-link" to="/login">
						Sign in
					</Link>
					<Link className="lp-btn lp-btnPrimary" to="/register">
						Create account
					</Link>
				</div>
			</header>

			<main className="lp-hero">
				<div className="lp-heroLeft">
					<div className="lp-badge">Simple • Fast • Secure</div>

					<h1 className="lp-title">
						A clean notes app that feels like a real product.
					</h1>

					<p className="lp-subtitle">
						Write, search, and edit notes with autosave and a modern
						editor. Built with React + Django.
					</p>

					<div className="lp-cta">
						<Link className="lp-btn lp-btnPrimary" to="/login">
							Get started
						</Link>
						<Link className="lp-btn lp-btnGhost" to="/notes">
							View app
						</Link>
					</div>

					<div className="lp-stats">
						<div className="lp-stat">
							<div className="lp-statNum">Autosave</div>
							<div className="lp-statLabel">No manual saving</div>
						</div>
						<div className="lp-stat">
							<div className="lp-statNum">Search</div>
							<div className="lp-statLabel">
								Find notes instantly
							</div>
						</div>
						<div className="lp-stat">
							<div className="lp-statNum">JWT</div>
							<div className="lp-statLabel">Secure auth</div>
						</div>
					</div>
				</div>

				<div className="lp-heroRight">
					<div className="lp-card">
						<div className="lp-cardTop">
							<div className="lp-dot lp-dotRed" />
							<div className="lp-dot lp-dotYellow" />
							<div className="lp-dot lp-dotGreen" />
						</div>

						<div className="lp-cardBody">
							<div className="lp-mockTitle">Meeting notes</div>
							<div className="lp-mockText">
								• Finalize tasks for next sprint
								<br />
								• Confirm API endpoints
								<br />• Prepare demo checklist
							</div>

							<div className="lp-mockDivider" />

							<div className="lp-mockTitle">Ideas</div>
							<div className="lp-mockText">
								Add tags, pin notes, and dark mode.
								<br />
								Improve list preview and sorting.
							</div>
						</div>

						<div className="lp-cardFooter">
							<span className="lp-pill">Saved</span>
							<span className="lp-pill lp-pillSoft">
								Last edited: Today
							</span>
						</div>
					</div>
				</div>
			</main>

			<footer className="lp-footer">
				<span>© {new Date().getFullYear()} Notes</span>
				<span className="lp-footerSep">•</span>
				<span>Built with React + Django</span>
			</footer>
		</div>
	);
};

export default Landing;
