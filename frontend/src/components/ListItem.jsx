import React from "react";
import { NavLink } from "react-router-dom";
import "./list-item.css";

const ListItem = ({ note }) => {
	const title =
		(note?.title ?? "").trim() ||
		(note?.body ?? "").trim().slice(0, 40) ||
		"Untitled";

	const preview = (note?.body ?? "").trim();

	return (
		<NavLink to={`/notes/${note.id}`} className="li-card">
			<div className="li-titleRow">
				<div className="li-title">{title}</div>
				<div className="li-meta">
					{new Date(note.updated).toLocaleDateString()}
				</div>
			</div>

			<div className="li-preview">{preview || "Empty note"}</div>
		</NavLink>
	);
};

export default ListItem;
