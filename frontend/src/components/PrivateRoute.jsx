import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

const PrivateRoute = () => {
	const { authTokens, loadingAuth } = useContext(AuthContext);

	if (loadingAuth) return null; // or a spinner

	return authTokens?.access ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
