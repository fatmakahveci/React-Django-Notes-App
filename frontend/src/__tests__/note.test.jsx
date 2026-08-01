import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Note from "../pages/Note";

const { authApi } = vi.hoisted(() => ({
	authApi: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

vi.mock("../api/authApi", () => ({
	createAuthApi: vi.fn(() => authApi),
}));

const contextValue = {
	authTokens: { access: "access", refresh: "refresh" },
	setAuthTokens: vi.fn(),
	logoutUser: vi.fn(),
};

const renderNote = (path) =>
	render(
		<AuthContext.Provider value={contextValue}>
			<MemoryRouter initialEntries={[path]}>
				<Routes>
					<Route path="/notes/new" element={<Note />} />
					<Route path="/notes/:noteId" element={<Note />} />
				</Routes>
			</MemoryRouter>
		</AuthContext.Provider>,
	);

beforeEach(() => {
	vi.useFakeTimers();
	vi.clearAllMocks();
});

afterEach(() => {
	vi.clearAllTimers();
	vi.useRealTimers();
});

test("creates a new note after the autosave delay", async () => {
	authApi.post.mockResolvedValue({ data: { id: 7, body: "First draft" } });
	renderNote("/notes/new");

	fireEvent.change(screen.getByPlaceholderText("Start typing..."), {
		target: { value: "First draft" },
	});
	await act(() => vi.advanceTimersByTimeAsync(700));

	await act(async () => Promise.resolve());
	expect(authApi.post).toHaveBeenCalledWith("/api/notes/", {
		body: "First draft",
	});
});

test("does not create an empty note", async () => {
	renderNote("/notes/new");

	fireEvent.change(screen.getByPlaceholderText("Start typing..."), {
		target: { value: "   " },
	});
	await act(() => vi.advanceTimersByTimeAsync(700));

	expect(authApi.post).not.toHaveBeenCalled();
});

test("loads and patches an existing note", async () => {
	authApi.get.mockResolvedValue({ data: { id: 9, body: "Old body" } });
	authApi.patch.mockResolvedValue({ data: { id: 9, body: "New body" } });
	renderNote("/notes/9");

	await act(async () => Promise.resolve());
	expect(authApi.get).toHaveBeenCalledWith("/api/notes/9/");
	fireEvent.change(screen.getByPlaceholderText("Start typing..."), {
		target: { value: "New body" },
	});
	await act(() => vi.advanceTimersByTimeAsync(700));

	await act(async () => Promise.resolve());
	expect(authApi.patch).toHaveBeenCalledWith("/api/notes/9/", {
		body: "New body",
	});
});
