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
	const preview = screen.getByRole("img", { name: /notes dashboard/i });
	expect(preview).toHaveAttribute("loading", "lazy");
	expect(preview).toHaveAttribute("decoding", "async");
	expect(preview).toHaveAttribute("width", "1200");
	expect(preview).toHaveAttribute("height", "782");
	expect(preview.closest("picture")?.querySelector("source")).toHaveAttribute(
		"srcset",
		expect.stringContaining("notes-demo-480.webp 480w"),
	);
});

test("shows notes CTA when logged in", () => {
	renderLanding({ access: "fake" }, { user_name: "demo" });
	expect(screen.getByText(/Go to notes/i)).toBeInTheDocument();
});
