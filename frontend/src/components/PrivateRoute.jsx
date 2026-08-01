import { useContext } from "react";
import AuthContext from "../context/AuthContext";
import { Navigate } from "../router";

const PrivateRoute = ({ children }) => {
	const { authTokens, loadingAuth } = useContext(AuthContext);

	if (loadingAuth) return <div className="route-loading" role="status">Loading session…</div>;

	return authTokens?.access ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
