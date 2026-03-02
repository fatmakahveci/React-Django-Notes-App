import React, { useContext, useEffect, useMemo, useState } from "react";
import AuthContext from "../context/AuthContext";
import { createAuthApi } from "../api/authApi";
import ListItem from "../components/ListItem";
import AddButton from "../components/AddButton";
import "./notes.css";

const NoteList = () => {
	const { authTokens, setAuthTokens, logoutUser } = useContext(AuthContext);

	const authApi = useMemo(() => {
		return createAuthApi({
			authTokens,
			setAuthTokens,
			logoutUser,
			refreshPath: "/api/accounts/token/refresh/",
		});
	}, [authTokens, setAuthTokens, logoutUser]);

	const [notes, setNotes] = useState([]);
	const [query, setQuery] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchNotes = async () => {
			setLoading(true);
			setError("");
			try {
				const res = await authApi.get("/api/notes/");
				setNotes(Array.isArray(res.data) ? res.data : []);
			} catch (err) {
				const status = err?.response?.status;
				setError(
					status
						? `Failed to load notes (HTTP ${status}).`
						: "Failed to load notes.",
				);
			} finally {
				setLoading(false);
			}
		};

		fetchNotes();
	}, [authApi]);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return notes;
		return notes.filter((n) => {
			const title = (n.title ?? "").toLowerCase();
			const body = (n.body ?? "").toLowerCase();
			return title.includes(q) || body.includes(q);
		});
	}, [notes, query]);

	return (
		<div className="nl-page">
			<div className="nl-shell">
				<div className="nl-top">
					<div>
						<h1 className="nl-title">Your notes</h1>
						<p className="nl-subtitle">{notes.length} total</p>
					</div>

					<div className="nl-searchWrap">
						<input
							className="nl-search"
							placeholder="Search notes..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
						/>
					</div>
				</div>

				{error ? <div className="nl-alert">{error}</div> : null}
				{loading ? <div className="nl-loading">Loading...</div> : null}

				<div className="nl-grid">
					{filtered.map((note) => (
						<ListItem key={note.id} note={note} />
					))}

					{!loading && filtered.length === 0 ? (
						<div className="nl-empty">
							<div className="nl-emptyTitle">No notes found</div>
							<div className="nl-emptyText">
								Create a note to get started.
							</div>
						</div>
					) : null}
				</div>

				<AddButton />
			</div>
		</div>
	);
};

export default NoteList;
