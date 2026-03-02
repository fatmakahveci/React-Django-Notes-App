import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as LeftArrow } from "../assets/left_arrow.svg";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import "./note-editor.css";
import api from "../api/axios";

const AUTOSAVE_DELAY_MS = 800;

const Note = () => {
	const params = useParams();
	const noteId = params.noteId ?? "new";
	const navigate = useNavigate();

	const { authTokens, setAuthTokens, logoutUser } = useContext(AuthContext);

	const [note, setNote] = useState({ body: "" });
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error

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
			1500,
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

	useEffect(() => {
		if (!authTokens?.access) {
			navigate("/login", { replace: true });
			return;
		}
		if (!noteId) return;

		const fetchNote = async () => {
			setError("");
			setSaveState("idle");

			if (noteId === "new") {
				setLoading(false);
				setNote({ body: "" });
				lastSavedBodyRef.current = "";
				isFirstLoadRef.current = false;
				return;
			}

			setLoading(true);
			try {
				const res = await authApi.get(`/api/notes/${noteId}/`);
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
	}, [noteId, authTokens, navigate, authApi]);

	const createNote = async (body) => {
		console.log("CREATE -> POST /api/notes/", { body });
		setSaveState("saving");
		setError("");

		try {
			const res = await api.post(
				"/api/notes/",
				{ body: body ?? "" },
				{
					headers: { Authorization: `Bearer ${authTokens?.access}` },
				},
			);
			const created = res.data;

			setNote(created);
			lastSavedBodyRef.current = (created?.body ?? "").toString();

			setSaveState("saved");
			showSavedTemporarily();

			navigate(`/notes/${created.id}`, { replace: true });
		} catch (err) {
			console.log(
				"CREATE ERROR",
				err?.response?.status,
				err?.response?.data,
				err?.message,
			);

			setSaveState("error");
			setHttpError("Failed to create note", err);
		}
	};

	const updateNote = async (id, body) => {
		console.log("UPDATE -> POST /api/notes/:id/", { id, body });
		if (!id || id === "new") return;

		setSaveState("saving");
		setError("");

		try {
			const res = await api.post(
				`/api/notes/${id}/`,
				{ body: body ?? "" },
				{
					headers: { Authorization: `Bearer ${authTokens?.access}` },
				},
			);
			const updated = res.data ?? { ...note, body };

			setNote(updated);
			lastSavedBodyRef.current = (updated?.body ?? body ?? "").toString();

			setSaveState("saved");
			showSavedTemporarily();
		} catch (err) {
			console.log(
				"UPDATE ERROR",
				err?.response?.status,
				err?.response?.data,
				err?.message,
			);
			setSaveState("error");
			setHttpError("Failed to update note", err);
		}
	};

	const deleteNote = async () => {
		if (!noteId || noteId === "new") {
			navigate("/notes");
			return;
		}

		setSaveState("saving");
		setError("");

		try {
			await authApi.delete(`/api/notes/${noteId}/`);
			navigate("/notes");
		} catch (err) {
			setSaveState("error");
			setHttpError("Failed to delete note", err);
		}
	};

	useEffect(() => {
		if (!noteId) return;
		if (loading) return;
		if (isFirstLoadRef.current) return;

		const body = (note?.body ?? "").toString();
		if (body === lastSavedBodyRef.current) return;

		if (noteId === "new") {
			if (body.trim().length > 0) createNote(body);
		} else {
			updateNote(noteId, body);
		}
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

		autosaveTimerRef.current = setTimeout(() => {
			if (noteId === "new") createNote(body);
			else updateNote(noteId, body);
		}, AUTOSAVE_DELAY_MS);

		return () => {
			if (autosaveTimerRef.current)
				clearTimeout(autosaveTimerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [note?.body, noteId, loading]);

	const handleSaveNow = async () => {
		const body = (note?.body ?? "").trim();
		if (!body) return;

		if (noteId === "new") {
			await createNote(body);
		} else {
			await updateNote(noteId, body);
		}
	};

	const handleBack = () => {
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
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
							className="ne-btn ne-primaryBtn"
							onClick={handleSaveNow}
							disabled={busy}
						>
							Save
						</button>

						{noteId !== "new" && (
							<button
								type="button"
								className="ne-btn ne-dangerBtn"
								onClick={deleteNote}
								disabled={busy}
							>
								Delete
							</button>
						)}
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
