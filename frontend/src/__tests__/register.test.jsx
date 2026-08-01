import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Route, Switch } from "wouter";
import AuthContext from "../context/AuthContext";
import Register from "../pages/Register";
import TestRouter from "../testRouter";

const renderRegister = (registerUser) =>
	render(
		<AuthContext.Provider value={{ registerUser, authTokens: null }}>
			<TestRouter path="/register">
				<Switch>
					<Route path="/register"><Register /></Route>
					<Route path="/login"><div>Login destination</div></Route>
				</Switch>
			</TestRouter>
		</AuthContext.Provider>,
	);

const fillValidForm = () => {
	fireEvent.change(screen.getByPlaceholderText("yourname"), {
		target: { value: "validuser" },
	});
	fireEvent.change(screen.getByPlaceholderText("you@example.com"), {
		target: { value: "valid@example.com" },
	});
	fireEvent.change(screen.getByPlaceholderText("At least 8 characters"), {
		target: { value: "StrongPass1!" },
	});
	fireEvent.change(screen.getByPlaceholderText("Repeat password"), {
		target: { value: "StrongPass1!" },
	});
};

test("submits valid registration data and navigates to login", async () => {
	const registerUser = vi.fn().mockResolvedValue({ ok: true });
	renderRegister(registerUser);
	fillValidForm();

	fireEvent.click(screen.getByRole("button", { name: "Create account" }));

	await waitFor(() => expect(screen.getByText("Login destination")).toBeInTheDocument());
	expect(registerUser).toHaveBeenCalledWith({
		email: "valid@example.com",
		user_name: "validuser",
		password: "StrongPass1!",
		match_password: "StrongPass1!",
	});
});

test("renders the API error and stays on the registration page", async () => {
	const registerUser = vi.fn().mockResolvedValue({
		ok: false,
		error: "Email already exists.",
	});
	renderRegister(registerUser);
	fillValidForm();

	fireEvent.click(screen.getByRole("button", { name: "Create account" }));

	await waitFor(() =>
		expect(screen.getByText("Email already exists.")).toBeInTheDocument(),
	);
	expect(screen.getByText("Create your account")).toBeInTheDocument();
});
