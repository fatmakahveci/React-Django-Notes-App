import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthContext from "../context/AuthContext";
import NoteList from "../pages/NoteList";
import TestRouter from "../testRouter";

const { authApi } = vi.hoisted(() => ({
	authApi: { get: vi.fn() },
}));

vi.mock("../api/authApi", () => ({
	createAuthApi: vi.fn(() => authApi),
}));

const renderList = () =>
	render(
		<AuthContext.Provider
			value={{
				authTokens: { access: "access" },
				setAuthTokens: vi.fn(),
				logoutUser: vi.fn(),
			}}
		>
			<TestRouter>
				<NoteList />
			</TestRouter>
		</AuthContext.Provider>,
	);

beforeEach(() => vi.clearAllMocks());

test("loads notes and filters them by title or body", async () => {
	authApi.get.mockResolvedValue({
		data: {
			count: 2,
			results: [
				{ id: 1, title: "Work", body: "Release checklist" },
				{ id: 2, title: "Home", body: "Buy coffee" },
			],
		},
	});
	renderList();

	await waitFor(() => expect(screen.getByText("2 total")).toBeInTheDocument());
	expect(screen.getByText("Work")).toBeInTheDocument();
	expect(screen.getByText("Home")).toBeInTheDocument();

	fireEvent.change(screen.getByPlaceholderText("Search notes..."), {
		target: { value: "coffee" },
	});
	await waitFor(() =>
		expect(authApi.get).toHaveBeenLastCalledWith("/api/notes/?page=1&search=coffee"),
	);
});

test("shows an empty state for an empty response", async () => {
	authApi.get.mockResolvedValue({ data: { count: 0, results: [] } });
	renderList();

	await waitFor(() => expect(screen.getByText("No notes found")).toBeInTheDocument());
	expect(screen.getByText("0 total")).toBeInTheDocument();
});

test("shows the HTTP status when loading fails", async () => {
	authApi.get.mockRejectedValue({ response: { status: 503 } });
	renderList();

	await waitFor(() =>
		expect(screen.getByText(/HTTP 503/)).toBeInTheDocument(),
	);
});
