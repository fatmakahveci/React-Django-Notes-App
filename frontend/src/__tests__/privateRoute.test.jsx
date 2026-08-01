import { render, screen } from "@testing-library/react";
import { Route, Switch } from "wouter";
import AuthContext from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";
import TestRouter from "../testRouter";

const renderWithAuth = (authTokens, loadingAuth = false) =>
	render(
		<TestRouter path="/notes">
			<AuthContext.Provider value={{ authTokens, loadingAuth }}>
				<Switch>
					<Route path="/login"><div>Login</div></Route>
					<Route path="/notes">
						<PrivateRoute><div>Protected</div></PrivateRoute>
					</Route>
				</Switch>
			</AuthContext.Provider>
		</TestRouter>,
	);

test("redirects to login when logged out", () => {
	renderWithAuth(null);
	expect(screen.getByText("Login")).toBeInTheDocument();
});

test("renders protected page when logged in", () => {
	renderWithAuth({ access: "fake" });
	expect(screen.getByText("Protected")).toBeInTheDocument();
});

test("does not redirect while authentication is loading", () => {
	renderWithAuth(null, true);
	expect(screen.queryByText("Login")).not.toBeInTheDocument();
	expect(screen.queryByText("Protected")).not.toBeInTheDocument();
});
