import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import api from "../api/axios";
import AuthContext, { AuthProvider } from "../context/AuthContext";

vi.mock("../api/axios", () => ({
	default: { post: vi.fn() },
}));

const jwt = (payload) =>
	`header.${btoa(JSON.stringify(payload)).replace(/=/g, "")}.signature`;

function ContextProbe() {
	return (
		<AuthContext.Consumer>
			{(context) => (
				<>
					<div data-testid="loading">{String(context.loadingAuth)}</div>
					<div data-testid="user">{context.user?.user_name || "anonymous"}</div>
					<div data-testid="error">{context.authError}</div>
					<button
						onClick={() =>
							context.loginUser({
								preventDefault: vi.fn(),
								target: {
									email: { value: "user@example.com" },
									password: { value: "StrongPass1!" },
								},
							})
						}
					>
						login
					</button>
					<button onClick={context.logoutUser}>logout</button>
				</>
			)}
		</AuthContext.Consumer>
	);
}

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
});

test("persists tokens and exposes the decoded user after login", async () => {
	const tokens = {
		access: jwt({ user_name: "demo", email: "user@example.com" }),
		refresh: "refresh-token",
	};
	api.post.mockResolvedValue({ data: tokens });
	render(<AuthProvider><ContextProbe /></AuthProvider>);

	await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
	fireEvent.click(screen.getByText("login"));

	await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("demo"));
	expect(JSON.parse(localStorage.getItem("authTokens"))).toEqual(tokens);
	expect(api.post).toHaveBeenCalledWith("/api/accounts/token/", {
		email: "user@example.com",
		password: "StrongPass1!",
	});
});

test("clears stored authentication and reports a failed login", async () => {
	localStorage.setItem("authTokens", JSON.stringify({ access: jwt({ user_name: "old" }) }));
	api.post.mockRejectedValue(new Error("invalid credentials"));
	render(<AuthProvider><ContextProbe /></AuthProvider>);

	fireEvent.click(screen.getByText("login"));

	await waitFor(() =>
		expect(screen.getByTestId("error")).toHaveTextContent("Login failed"),
	);
	expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
	expect(localStorage.getItem("authTokens")).toBeNull();
});

test("logout clears user state and local storage", async () => {
	localStorage.setItem(
		"authTokens",
		JSON.stringify({ access: jwt({ user_name: "demo" }) }),
	);
	render(<AuthProvider><ContextProbe /></AuthProvider>);

	expect(screen.getByTestId("user")).toHaveTextContent("demo");
	fireEvent.click(screen.getByText("logout"));

	expect(screen.getByTestId("user")).toHaveTextContent("anonymous");
	expect(localStorage.getItem("authTokens")).toBeNull();
});
