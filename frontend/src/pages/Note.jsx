import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "../router";
import LeftArrow from "../assets/left_arrow.svg?react";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import { normalizeApiError } from "../api/client";
import "./note-editor.css";

const AUTOSAVE_DELAY_MS = 700;

const Note = () => {
	const params = useParams();
	// `/notes/new` is a separate route, so only existing notes have a route ID.
	const noteIdFromRoute = params.noteId;
	const isNewRoute = !noteIdFromRoute;
	const navigate = useNavigate();

	const { setAuthTokens, clearAuth } = useContext(AuthContext);

	const [note, setNote] = useState({ title: "", body: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

	// Retain the server ID after the first autosave so later saves update the same draft.
	const [draftId, setDraftId] = useState(null);

	const authApi = useMemo(() => {
		return createAuthApi({
			setAuthTokens,
			onUnauthorized: clearAuth,
			refreshPath: "/api/accounts/token/refresh/",
		});
	}, [setAuthTokens, clearAuth]);

	const isFirstLoadRef = useRef(true);
	const lastSavedContentRef = useRef("");
	const autosaveTimerRef = useRef(null);
	const savedBadgeTimerRef = useRef(null);

	const showSavedTemporarily = () => {
		if (savedBadgeTimerRef.current)
			clearTimeout(savedBadgeTimerRef.current);
		savedBadgeTimerRef.current = setTimeout(
			() => setSaveState("idle"),
			1200,
		);
	};

	const setHttpError = (prefix, err) => {
		const apiError = normalizeApiError(err, prefix);
		setError(
			apiError.status
				? `${prefix} (HTTP ${apiError.status}). ${apiError.message}`
				: apiError.message,
		);
	};

	// Load note for edit route
	useEffect(() => {
		setError("");
		setSaveState("idle");

		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
		if (savedBadgeTimerRef.current)
			clearTimeout(savedBadgeTimerRef.current);

		if (isNewRoute) {
			setLoading(false);
			setNote({ title: "", body: "" });
			setDraftId(null);
			lastSavedContentRef.current = JSON.stringify({ title: "", body: "" });
			isFirstLoadRef.current = false;
			return;
		}

		const fetchNote = async () => {
			setLoading(true);
			try {
				const res = await authApi.get(`/api/notes/${noteIdFromRoute}/`);
				setNote(res.data);
				lastSavedContentRef.current = JSON.stringify({
					title: res.data?.title ?? "",
					body: res.data?.body ?? "",
				});
			} catch (err) {
				setHttpError("Failed to load note", err);
			} finally {
				setLoading(false);
				isFirstLoadRef.current = false;
			}
		};

		fetchNote();

		return () => {
			if (autosaveTimerRef.current)
				clearTimeout(autosaveTimerRef.current);
			if (savedBadgeTimerRef.current)
				clearTimeout(savedBadgeTimerRef.current);
		};
	}, [isNewRoute, noteIdFromRoute, authApi]);

	const createNote = async (content) => {
		setSaveState("saving");
		setError("");

		try {
			const res = await authApi.post("/api/notes/", content);
			const created = res.data;

			setNote(created);
			lastSavedContentRef.current = JSON.stringify({
				title: created?.title ?? "",
				body: created?.body ?? "",
			});

			// Staying on the current route preserves textarea focus while typing.
			if (created?.id) setDraftId(String(created.id));

			setSaveState("saved");
			showSavedTemporarily();
		} catch (err) {
			setSaveState("error");
			setHttpError("Failed to create note", err);
		}
	};

	const updateNote = async (id, content) => {
		if (!id) return;

		setSaveState("saving");
		setError("");

		try {
			const res = await authApi.patch(`/api/notes/${id}/`, content);
			const updated = res.data ?? { ...note, ...content };

			setNote(updated);
			lastSavedContentRef.current = JSON.stringify({
				title: updated?.title ?? "",
				body: updated?.body ?? "",
			});

			setSaveState("saved");
			showSavedTemporarily();
		} catch (err) {
			setSaveState("error");
			setHttpError("Failed to update note", err);
		}
	};

	const deleteNote = async () => {
		const idToDelete = isNewRoute ? draftId : noteIdFromRoute;
		if (!idToDelete) {
			navigate("/notes");
			return;
		}

		setSaveState("saving");
		setError("");

		try {
			await authApi.delete(`/api/notes/${idToDelete}/`);
			navigate("/notes");
		} catch (err) {
			setSaveState("error");
			setHttpError("Failed to delete note", err);
		}
	};

	// Debounce autosave: create once on `/notes/new`, then update via `draftId`.
	useEffect(() => {
		if (loading) return;
		if (isFirstLoadRef.current) return;

		const content = {
			title: (note?.title ?? "").toString(),
			body: (note?.body ?? "").toString(),
		};
		const serialized = JSON.stringify(content);

		if (serialized === lastSavedContentRef.current) return;

		// Avoid creating empty records when a user opens and leaves a new note.
		if (!content.title.trim() && !content.body.trim()) {
			setSaveState("idle");
			return;
		}

		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

		autosaveTimerRef.current = setTimeout(() => {
			const idToUpdate = isNewRoute ? draftId : noteIdFromRoute;

			if (!idToUpdate) createNote(content);
			else updateNote(idToUpdate, content);
		}, AUTOSAVE_DELAY_MS);

		return () => {
			if (autosaveTimerRef.current)
				clearTimeout(autosaveTimerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [note?.title, note?.body, draftId, isNewRoute, loading]);

	const handleBack = () => {
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

		// Replace the temporary `/new` URL once the draft has a persistent ID.
		if (isNewRoute && draftId) {
			navigate(`/notes/${draftId}`, { replace: true });
			return;
		}
		navigate("/notes");
	};

	const busy = loading || saveState === "saving";

	return (
		<div className="ne-page">
			<div className="ne-shell">
				<header className="ne-header">
					<div className="ne-left">
						<button
							type="button"
							className="ne-iconBtn"
							onClick={handleBack}
							disabled={loading}
							aria-label="Back"
							title="Back"
						>
							<LeftArrow className="ne-icon" />
						</button>
						<h2 className="ne-titleText">Notes</h2>
					</div>

					<div className="ne-headerRight">
						<span
							aria-live="polite"
							className={[
								"ne-badge",
								saveState === "saving" ? "ne-badgeSaving" : "",
								saveState === "saved" ? "ne-badgeSaved" : "",
								saveState === "error" ? "ne-badgeError" : "",
								saveState === "idle" ? "ne-badgeHidden" : "",
							].join(" ")}
						>
							{saveState === "saving"
								? "Saving..."
								: saveState === "saved"
									? "Saved"
									: saveState === "error"
										? "Save failed"
										: ""}
						</span>

						<button
							type="button"
							className="ne-btn ne-dangerBtn"
							onClick={deleteNote}
							disabled={busy}
						>
							Delete
						</button>
					</div>
				</header>

				{error ? <div className="ne-alert" role="alert">{error}</div> : null}

				<main className="ne-card">
					<div className="ne-cardInner">
						<label className="visually-hidden" htmlFor="note-title">Note title</label>
						<input
							id="note-title"
							className="ne-titleInput"
							maxLength={120}
							disabled={loading}
							placeholder="Note title"
							value={note?.title ?? ""}
							onChange={(event) => setNote((previous) => ({
								...previous,
								title: event.target.value,
							}))}
						/>
						<label className="visually-hidden" htmlFor="note-body">Note content</label>
						<textarea
							id="note-body"
							className="ne-textarea"
							autoFocus
							disabled={loading}
							placeholder="Start typing..."
							value={note?.body ?? ""}
							onChange={(e) =>
								setNote((prev) => ({
									...prev,
									body: e.target.value,
								}))
							}
						/>
					</div>
				</main>
			</div>
		</div>
	);
};

export default Note;
