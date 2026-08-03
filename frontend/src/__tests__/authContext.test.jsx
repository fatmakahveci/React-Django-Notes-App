import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../api/axios";
import AuthContext, { AuthProvider } from "../context/AuthContext";

vi.mock("../api/axios", () => ({
	default: { get: vi.fn(), post: vi.fn() },
}));

function ContextProbe() {
	return (
		<AuthContext.Consumer>
			{(context) => (
				<>
					<div data-testid="loading">{String(context.loadingAuth)}</div>
					<div data-testid="user">{context.user?.user_name || "anonymous"}</div>
					<div data-testid="error">{context.authError}</div>
					<button onClick={() => context.loginUser({
						preventDefault: vi.fn(),
						target: {
							email: { value: "user@example.com" },
							password: { value: "StrongPass1!" },
						},
					})}>login</button>
					<button onClick={context.logoutUser}>logout</button>
				</>
			)}
		</AuthContext.Consumer>
	);
}

async function renderLoggedOut() {
	api.get.mockImplementation((url) =>
		url.endsWith("/csrf/") ? Promise.resolve({ data: {} }) : Promise.reject(new Error("no session")),
	);
	api.post.mockRejectedValue(new Error("no refresh cookie"));
	render(<AuthProvider><ContextProbe /></AuthProvider>);
	await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
	vi.clearAllMocks();
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

test("uses the server session and never stores tokens in browser storage", async () => {
	await renderLoggedOut();
	api.get.mockResolvedValue({ data: {} });
	api.post.mockResolvedValue({ data: { user: { user_name: "demo" } } });

	fireEvent.click(screen.getByText("login"));

	await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("demo"));
	expect(localStorage.getItem("authTokens")).toBeNull();
	expect(api.post).toHaveBeenCalledWith("/api/accounts/token/", {
		email: "user@example.com",
		password: "StrongPass1!",
	});
});

test("clears authentication and reports a failed login", async () => {
	await renderLoggedOut();
	api.get.mockResolvedValue({ data: {} });
	api.post.mockRejectedValue(new Error("invalid credentials"));

	fireEvent.click(screen.getByText("login"));

	await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("Unable to reach the server"));
	expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
});

test("restores an authenticated session from HttpOnly cookies", async () => {
	api.get.mockImplementation((url) => {
		if (url.endsWith("/csrf/")) return Promise.resolve({ data: {} });
		return Promise.resolve({ data: { user: { user_name: "restored" } } });
	});
	render(<AuthProvider><ContextProbe /></AuthProvider>);

	await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("restored"));
	expect(localStorage.getItem("authTokens")).toBeNull();
});
