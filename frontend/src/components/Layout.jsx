import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "./layout.css";

const Layout = () => {
	const { logoutUser } = useContext(AuthContext);
	const navigate = useNavigate();

	const handleLogout = () => {
		logoutUser();
		navigate("/", { replace: true });
	};

	return (
		<div className="app-layout">
			<header className="app-navbar">
				<div className="nav-left">
					<Link to="/" className="brand">
						Notes
					</Link>

					<NavLink
						to="/"
						className={({ isActive }) =>
							`nav-link ${isActive ? "nav-linkActive" : ""}`
						}
					>
						Home
					</NavLink>

					<NavLink
						to="/notes"
						className={({ isActive }) =>
							`nav-link ${isActive ? "nav-linkActive" : ""}`
						}
					>
						Notes
					</NavLink>
				</div>

				<div className="nav-right">
					<button className="logout-btn" onClick={handleLogout}>
						Logout
					</button>
				</div>
			</header>

			<main className="app-content">
				<Outlet />
			</main>
		</div>
	);
};

export default Layout;
