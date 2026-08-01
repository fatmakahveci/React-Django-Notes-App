import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LeftArrow from "../assets/left_arrow.svg?react";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import "./note-editor.css";

const AUTOSAVE_DELAY_MS = 700;

const Note = () => {
	const params = useParams();
	// `/notes/new` is a separate route, so only existing notes have a route ID.
	const noteIdFromRoute = params.noteId;
	const isNewRoute = !noteIdFromRoute;
	const navigate = useNavigate();

	const { authTokens, setAuthTokens, logoutUser } = useContext(AuthContext);

	const [note, setNote] = useState({ body: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

	// Retain the server ID after the first autosave so later saves update the same draft.
	const [draftId, setDraftId] = useState(null);

	const authApi = useMemo(() => {
		return createAuthApi({
			authTokens,
			setAuthTokens,
			logoutUser,
			refreshPath: "/api/accounts/token/refresh/",
		});
	}, [authTokens, setAuthTokens, logoutUser]);

	const isFirstLoadRef = useRef(true);
	const lastSavedBodyRef = useRef("");
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
		const status = err?.response?.status;
		const detail =
			err?.response?.data?.detail ||
			err?.response?.data?.message ||
			err?.message ||
			"";
		setError(
			status
				? `${prefix} (HTTP ${status}). ${detail}`
				: `${prefix}. ${detail}`,
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
			setNote({ body: "" });
			setDraftId(null);
			lastSavedBodyRef.current = "";
			isFirstLoadRef.current = false;
			return;
		}

		const fetchNote = async () => {
			setLoading(true);
			try {
				const res = await authApi.get(`/api/notes/${noteIdFromRoute}/`);
				setNote(res.data);
				lastSavedBodyRef.current = (res.data?.body ?? "").toString();
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

	const createNote = async (body) => {
		setSaveState("saving");
		setError("");

		try {
			const res = await authApi.post("/api/notes/", { body: body ?? "" });
			const created = res.data;

			setNote(created);
			lastSavedBodyRef.current = (created?.body ?? "").toString();

			// Staying on the current route preserves textarea focus while typing.
			if (created?.id) setDraftId(String(created.id));

			setSaveState("saved");
			showSavedTemporarily();
		} catch (err) {
			setSaveState("error");
			setHttpError("Failed to create note", err);
		}
	};

	const updateNote = async (id, body) => {
		if (!id) return;

		setSaveState("saving");
		setError("");

		try {
			const res = await authApi.patch(`/api/notes/${id}/`, {
				body: body ?? "",
			});
			const updated = res.data ?? { ...note, body };

			setNote(updated);
			lastSavedBodyRef.current = (updated?.body ?? body ?? "").toString();

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

		const body = (note?.body ?? "").toString();
		const trimmed = body.trim();

		if (body === lastSavedBodyRef.current) return;

		// Avoid creating empty records when a user opens and leaves a new note.
		if (trimmed.length === 0) {
			setSaveState("idle");
			return;
		}

		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

		autosaveTimerRef.current = setTimeout(() => {
			const idToUpdate = isNewRoute ? draftId : noteIdFromRoute;

			if (!idToUpdate) createNote(body);
			else updateNote(idToUpdate, body);
		}, AUTOSAVE_DELAY_MS);

		return () => {
			if (autosaveTimerRef.current)
				clearTimeout(autosaveTimerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [note?.body, draftId, isNewRoute, loading]);

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

				{error ? <div className="ne-alert">{error}</div> : null}

				<main className="ne-card">
					<div className="ne-cardInner">
						<textarea
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
