import React from "react";
import { NavLink } from "react-router-dom";
import "./list-item.css";

const formatDate = (isoString) => {
	if (!isoString) return "";
	const d = new Date(isoString);
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
};

const buildPreview = (text) => {
	const clean = (text ?? "").toString().replace(/\s+/g, " ").trim();
	if (!clean) return "No content";
	return clean.length > 140 ? `${clean.slice(0, 140)}…` : clean;
};

const ListItem = ({ note }) => {
	const title = (note?.title ?? "").toString().trim() || "Untitled";
	const preview = buildPreview(note?.body);
	const date = formatDate(note?.updated ?? note?.created);

	return (
		<NavLink to={`/notes/${note.id}/`} className="noteRow">
			<div className="noteRow-inner">
				<div className="noteRow-text">
					<h3 className="noteRow-title">{title}</h3>
					<p className="noteRow-preview">{preview}</p>
				</div>

				<div className="noteRow-meta">
					{date ? <span className="noteRow-date">{date}</span> : null}
					<span className="noteRow-chevron">›</span>
				</div>
			</div>
		</NavLink>
	);
};

export default ListItem;
