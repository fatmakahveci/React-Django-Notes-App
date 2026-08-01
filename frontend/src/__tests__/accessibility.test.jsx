import { render } from "@testing-library/react";
import axe from "axe-core";
import AuthContext from "../context/AuthContext";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import TestRouter from "../testRouter";

const authValue = {
	authTokens: null,
	user: null,
	loginUser: vi.fn(),
	registerUser: vi.fn(),
	logoutUser: vi.fn(),
	authError: "",
};

const renderPage = (component, path = "/") =>
	render(
		<AuthContext.Provider value={authValue}>
			<TestRouter path={path}>{component}</TestRouter>
		</AuthContext.Provider>,
	);

const expectNoAxeViolations = async (container) => {
	const results = await axe.run(container, {
		// jsdom cannot calculate actual foreground/background rendering.
		rules: { "color-contrast": { enabled: false } },
	});
	expect(results.violations).toEqual([]);
};

test.each([
	["landing", <Landing />, "/"],
	["login", <Login />, "/login"],
	["registration", <Register />, "/register"],
])("%s page has no detectable accessibility violations", async (_name, page, path) => {
	const { container } = renderPage(page, path);
	await expectNoAxeViolations(container);
});
