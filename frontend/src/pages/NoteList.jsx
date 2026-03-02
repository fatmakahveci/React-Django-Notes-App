import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import AddButton from "../components/AddButton";
import ListItem from "../components/ListItem";
import "./note-list.css";

const NoteList = () => {
	const navigate = useNavigate();
	const { authTokens, setAuthTokens, logoutUser } = useContext(AuthContext);

	const [notes, setNotes] = useState([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const authApi = useMemo(() => {
		return createAuthApi({
			authTokens,
			setAuthTokens,
			logoutUser,
			refreshPath: "/api/token/refresh/",
			// If needed:
			// refreshPath: "/api/accounts/token/refresh/",
		});
	}, [authTokens, setAuthTokens, logoutUser]);

	useEffect(() => {
		if (!authTokens?.access) {
			navigate("/login", { replace: true });
			return;
		}

		const fetchNotes = async () => {
			setLoading(true);
			setError("");

			try {
				const res = await authApi.get("/api/notes/");
				setNotes(Array.isArray(res.data) ? res.data : []);
			} catch {
				setError("Failed to load notes.");
			} finally {
				setLoading(false);
			}
		};

		fetchNotes();
	}, [authTokens, navigate, authApi]);

	const filteredNotes = notes.filter((n) => {
		const body = (n?.body ?? "").toString().toLowerCase();
		return body.includes(query.trim().toLowerCase());
	});

	return (
		<div className="nl-page">
			<div className="nl-header">
				<div className="nl-titleBlock">
					<h1 className="nl-title">Your notes</h1>
					<p className="nl-subtitle">
						{loading ? "Loading..." : `${notes.length} total`}
					</p>
				</div>

				<input
					className="nl-search"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search notes..."
					aria-label="Search notes"
				/>
			</div>

			{error ? <div className="nl-alert">{error}</div> : null}

			<div className="nl-list">
				{loading ? (
					<div className="nl-skeleton">
						<div className="nl-skelRow" />
						<div className="nl-skelRow" />
						<div className="nl-skelRow" />
					</div>
				) : filteredNotes.length === 0 ? (
					<div className="nl-empty">
						<h3 className="nl-emptyTitle">
							{query.trim() ? "No matches found" : "No notes yet"}
						</h3>
						<p className="nl-emptyText">
							{query.trim()
								? "Try a different search term."
								: "Create your first note to get started."}
						</p>
					</div>
				) : (
					filteredNotes.map((note) => (
						<ListItem
							key={note.id ?? `${note.body}-${Math.random()}`}
							note={note}
						/>
					))
				)}
			</div>

			<AddButton />
		</div>
	);
};

export default NoteList;
