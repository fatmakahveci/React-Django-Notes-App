import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import PrivateRoute from "../components/PrivateRoute";

function ProtectedPage() {
	return <div>Protected</div>;
}

function LoginPage() {
	return <div>Login</div>;
}

function renderWithAuth(authTokens) {
	return render(
		<MemoryRouter initialEntries={["/notes"]}>
			<AuthContext.Provider value={{ authTokens, loadingAuth: false }}>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route element={<PrivateRoute />}>
						<Route path="/notes" element={<ProtectedPage />} />
					</Route>
				</Routes>
			</AuthContext.Provider>
		</MemoryRouter>,
	);
}

test("redirects to login when logged out", () => {
	renderWithAuth(null);
	expect(screen.getByText(/Login/i)).toBeInTheDocument();
});

test("renders protected page when logged in", () => {
	renderWithAuth({ access: "fake" });
	expect(screen.getByText(/Protected/i)).toBeInTheDocument();
});
