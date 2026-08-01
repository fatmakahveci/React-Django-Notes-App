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
	const [debouncedQuery, setDebouncedQuery] = useState("");
	const [page, setPage] = useState(1);
	const [pageCount, setPageCount] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query.trim());
			setPage(1);
		}, 300);
		return () => clearTimeout(timer);
	}, [query]);

	useEffect(() => {
		const fetchNotes = async () => {
			setLoading(true);
			setError("");
			try {
				const params = new URLSearchParams({ page: String(page) });
				if (debouncedQuery) params.set("search", debouncedQuery);
				const res = await authApi.get(`/api/notes/?${params}`);
				const results = Array.isArray(res.data?.results) ? res.data.results : [];
				const count = Number(res.data?.count || 0);
				setNotes(results);
				setTotalCount(count);
				setPageCount(Math.max(1, Math.ceil(count / 12)));
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
	}, [authApi, debouncedQuery, page]);

	return (
		<div className="nl-page">
			<div className="nl-shell">
				<div className="nl-top">
					<div>
						<h1 className="nl-title">Your notes</h1>
						<p className="nl-subtitle">{totalCount} total</p>
					</div>

					<div className="nl-searchWrap">
						<input
							className="nl-search"
							placeholder="Search notes..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							aria-label="Search notes"
						/>
					</div>
				</div>

				{error ? <div className="nl-alert" role="alert">{error}</div> : null}
				{loading ? <div className="nl-loading" role="status">Loading...</div> : null}

				<div className="nl-grid">
					{notes.map((note) => (
						<ListItem key={note.id} note={note} />
					))}

					{!loading && notes.length === 0 ? (
						<div className="nl-empty">
							<div className="nl-emptyTitle">No notes found</div>
							<div className="nl-emptyText">
								Create a note to get started.
							</div>
						</div>
					) : null}
				</div>

				{pageCount > 1 ? (
					<nav className="nl-pagination" aria-label="Notes pagination">
						<button disabled={page === 1 || loading} onClick={() => setPage((value) => value - 1)}>
							Previous
						</button>
						<span>Page {page} of {pageCount}</span>
						<button disabled={page === pageCount || loading} onClick={() => setPage((value) => value + 1)}>
							Next
						</button>
					</nav>
				) : null}

				<AddButton />
			</div>
		</div>
	);
};

export default NoteList;
