import { render, screen, waitFor } from "@testing-library/react";
import axe from "axe-core";
import api from "../api/axios";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import NoteList from "../pages/NoteList";
import Register from "../pages/Register";
import TestRouter from "../testRouter";

const { authApi } = vi.hoisted(() => ({
	authApi: { get: vi.fn() },
}));

vi.mock("../api/axios", () => ({
	default: { get: vi.fn() },
}));

vi.mock("../api/authApi", () => ({
	createAuthApi: vi.fn(() => authApi),
}));

const viewports = [
	{ name: "phone", width: 390, height: 844, pointer: "coarse" },
	{ name: "tablet", width: 768, height: 1024, pointer: "coarse" },
	{ name: "desktop", width: 1440, height: 900, pointer: "fine" },
];

const setViewport = ({ width, height, pointer }) => {
	Object.defineProperties(window, {
		innerWidth: { configurable: true, value: width },
		innerHeight: { configurable: true, value: height },
	});
	window.matchMedia = vi.fn((query) => ({
		matches:
			(query.includes("max-width: 520px") && width <= 520) ||
			(query.includes("max-width: 760px") && width <= 760) ||
			(query.includes("pointer: coarse") && pointer === "coarse"),
		media: query,
		onchange: null,
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		addListener: vi.fn(),
		removeListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}));
	window.dispatchEvent(new Event("resize"));
};

beforeEach(() => {
	vi.clearAllMocks();
	api.get.mockResolvedValue({
		data: {
			min_length: 8,
			max_length: 128,
			require_lowercase: true,
			require_uppercase: true,
			require_digit: true,
			require_special: true,
			requirements: ["Use 8-128 characters."],
		},
	});
	authApi.get.mockResolvedValue({ data: { count: 0, results: [] } });
});

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

const renderAuthenticatedPage = (component, path) =>
	render(
		<AuthContext.Provider
			value={{
				...authValue,
				authTokens: { access: "test-access-token" },
				user: { user_name: "demo" },
				setAuthTokens: vi.fn(),
				clearAuth: vi.fn(),
			}}
		>
			<TestRouter path={path}>
				<Layout>{component}</Layout>
			</TestRouter>
		</AuthContext.Provider>,
	);

const expectNoAxeViolations = async (container) => {
	const results = await axe.run(container, {
		// jsdom cannot calculate actual foreground/background rendering.
		rules: { "color-contrast": { enabled: false } },
	});
	expect(results.violations).toEqual([]);
};

describe.each(viewports)("$name viewport ($width x $height)", (viewport) => {
	beforeEach(() => setViewport(viewport));

	test.each([
		["landing", <Landing />, "/"],
		["login", <Login />, "/login"],
		["registration", <Register />, "/register"],
	])("%s page has no detectable accessibility violations", async (name, page, path) => {
		const { container } = renderPage(page, path);
		if (name === "registration") {
			await waitFor(() => expect(container.querySelector("#register-password")).toHaveAttribute("maxlength", "128"));
		}
		expect(container.querySelector("main")).toBeInTheDocument();
		await expectNoAxeViolations(container);
	});

	test("authenticated notes shell remains accessible", async () => {
		const { container } = renderAuthenticatedPage(<NoteList />, "/notes");
		await waitFor(() => expect(screen.getByText("No notes found")).toBeInTheDocument());

		expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
		expect(screen.getByRole("searchbox", { name: "Search notes" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
		await expectNoAxeViolations(container);
	});
});
