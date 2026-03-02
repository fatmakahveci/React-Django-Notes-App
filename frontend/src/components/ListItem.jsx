import React, { useMemo } from "react";
import { NavLink } from "react-router-dom";
import "./list-item.css";

const normalize = (s) => (s ?? "").toString().replace(/\s+/g, " ").trim();

const splitBody = (body) => {
	const raw = (body ?? "").toString();
	const lines = raw
		.split("\n")
		.map((l) => l.trim())
		.filter(Boolean);

	const first = lines[0] ?? "";
	const rest = lines.slice(1).join(" ");
	return { first, rest, raw: normalize(raw) };
};

const looksAutoTitle = (title) =>
	normalize(title).toLowerCase().startsWith("note of ");

const ListItem = ({ note }) => {
	const { titleText, previewText, dateText } = useMemo(() => {
		const title = normalize(note?.title);
		const { first, rest, raw } = splitBody(note?.body);

		const useBodyAsTitle =
			!title ||
			looksAutoTitle(title) ||
			normalize(title) === normalize(first);

		const computedTitle = useBodyAsTitle ? first || "Untitled" : title;
		const computedPreview =
			normalize(useBodyAsTitle ? rest : raw) || "Empty note";

		const updated = note?.updated ? new Date(note.updated) : null;

		return {
			titleText: computedTitle,
			previewText: computedPreview,
			dateText: updated ? updated.toLocaleDateString() : "",
		};
	}, [note]);

	return (
		<NavLink to={`/notes/${note.id}`} className="li-card">
			<div className="li-titleRow">
				<div className="li-title">{titleText}</div>
				<div className="li-meta">{dateText}</div>
			</div>

			<div className="li-preview">{previewText}</div>
		</NavLink>
	);
};

export default ListItem;
