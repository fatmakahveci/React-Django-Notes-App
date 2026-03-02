import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "../pages/Landing";
import AuthContext from "../context/AuthContext";

function renderLanding(authTokens = null, user = null) {
	return render(
		<MemoryRouter initialEntries={["/"]}>
			<AuthContext.Provider
				value={{ authTokens, user, logoutUser: jest.fn() }}
			>
				<Landing />
			</AuthContext.Provider>
		</MemoryRouter>,
	);
}

test("shows auth buttons when logged out", () => {
	renderLanding(null, null);
	expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
	expect(screen.getByText(/Create account/i)).toBeInTheDocument();
});

test("shows notes CTA when logged in", () => {
	renderLanding({ access: "fake" }, { user_name: "demo" });
	expect(screen.getByText(/Go to notes/i)).toBeInTheDocument();
});
