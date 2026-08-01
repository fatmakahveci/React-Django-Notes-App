import { act, fireEvent, render, screen } from "@testing-library/react";
import { Route, Switch } from "wouter";
import AuthContext from "../context/AuthContext";
import Note from "../pages/Note";
import TestRouter from "../testRouter";

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
			<TestRouter path={path}>
				<Switch>
					<Route path="/notes/new"><Note /></Route>
					<Route path="/notes/:noteId"><Note /></Route>
				</Switch>
			</TestRouter>
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
		title: "",
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
		title: "",
		body: "New body",
	});
});

test("autosaves title changes together with the body", async () => {
	authApi.get.mockResolvedValue({ data: { id: 10, title: "Old", body: "Body" } });
	authApi.patch.mockResolvedValue({ data: { id: 10, title: "New", body: "Body" } });
	renderNote("/notes/10");

	await act(async () => Promise.resolve());
	fireEvent.change(screen.getByPlaceholderText("Note title"), {
		target: { value: "New" },
	});
	await act(() => vi.advanceTimersByTimeAsync(700));
	await act(async () => Promise.resolve());

	expect(authApi.patch).toHaveBeenCalledWith("/api/notes/10/", {
		title: "New",
		body: "Body",
	});
});
