import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ReactComponent as LeftArrow } from "../assets/left_arrow.svg";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import "./note-editor.css";

const AUTOSAVE_DELAY_MS = 800;

const Note = () => {
	const { noteId: rawNoteId } = useParams();
	const noteId = (rawNoteId ?? "").replaceAll("/", "");

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

	useEffect(() => {
		if (!authTokens?.access) {
			navigate("/login", { replace: true });
			return;
		}

		if (!noteId) return;

		const fetchNote = async () => {
			setError("");
			setSaveState("idle");

			if (!noteId) return;

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
			} catch {
				setError("Failed to load note.");
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
		setSaveState("saving");
		setError("");

		try {
			const res = await authApi.post("/api/notes/", { body: body ?? "" });
			const created = res.data;

			setNote(created);
			lastSavedBodyRef.current = (created?.body ?? "").toString();

			setSaveState("saved");
			showSavedTemporarily();

			// Robust id detection (some serializers use id, some pk)
			const newId = created?.id ?? created?.pk;

			if (newId) {
				navigate(`/notes/${newId}`, { replace: true });
			} else {
				// If API didn't return an id, go back to list
				navigate("/notes", { replace: true });
			}
		} catch (err) {
			setSaveState("error");
			const status = err?.response?.status;
			const detail =
				err?.response?.data?.detail ||
				err?.response?.data?.message ||
				err?.message;

			setError(
				status
					? `Save failed (HTTP ${status}). ${detail ?? ""}`
					: `Save failed. ${detail ?? ""}`,
			);
		}
	};

	const updateNote = async (id, body) => {
		if (!id || id === "new") return;

		setSaveState("saving");
		setError("");

		try {
			const payload = { body: body ?? "" };

			const res = await authApi.post(`/api/notes/${id}/`, payload);

			const updated = res.data ?? { ...note, body };
			setNote(updated);
			lastSavedBodyRef.current = (updated?.body ?? body ?? "").toString();

			setSaveState("saved");
			showSavedTemporarily();
		} catch (err) {
			setSaveState("error");
			const status = err?.response?.status;
			const detail =
				err?.response?.data?.detail ||
				err?.response?.data?.message ||
				err?.message;

			setError(
				status
					? `Save failed (HTTP ${status}). ${detail ?? ""}`
					: `Save failed. ${detail ?? ""}`,
			);
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
		} catch {
			setSaveState("error");
			setError("Failed to delete note.");
		}
	};

	useEffect(() => {
		if (!noteId) return;
		if (loading) return;
		if (isFirstLoadRef.current) return;

		const body = (note?.body ?? "").toString();
		const trimmed = body.trim();

		if (body === lastSavedBodyRef.current) return;

		if (noteId === "new" && trimmed.length === 0) {
			setSaveState("idle");
			return;
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

	const handleBack = () => {
		if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
		navigate("/notes");
	};

	const busy = loading || saveState === "saving";

	return (
		<div className="ne-page">
			<div className="ne-shell">
				<header className="ne-header">
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

						{noteId !== "new" && noteId ? (
							<button
								type="button"
								className="ne-dangerBtn"
								onClick={deleteNote}
								disabled={busy}
							>
								Delete
							</button>
						) : null}
					</div>
				</header>

				{error ? <div className="ne-alert">{error}</div> : null}

				<main className="ne-card">
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
				</main>
			</div>
		</div>
	);
};

export default Note;
