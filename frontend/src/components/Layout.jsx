import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import "./layout.css";

const Layout = () => {
	const { logoutUser } = useContext(AuthContext);

	return (
		<div className="app-layout">
			<header className="app-navbar">
				<div className="nav-left">
					<Link to="/notes" className="brand">
						Notes
					</Link>
				</div>

				<div className="nav-right">
					<button className="logout-btn" onClick={logoutUser}>
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
