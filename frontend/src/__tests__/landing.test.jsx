import React from "react";
import { render, screen } from "@testing-library/react";
import Landing from "../pages/Landing";
import AuthContext from "../context/AuthContext";
import TestRouter from "../testRouter";

function renderLanding(authTokens = null, user = null) {
	return render(
		<TestRouter>
			<AuthContext.Provider
				value={{ authTokens, user, logoutUser: vi.fn() }}
			>
				<Landing />
			</AuthContext.Provider>
		</TestRouter>,
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
