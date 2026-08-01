import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ListItem from "../components/ListItem";

const renderItem = (note) =>
	render(
		<MemoryRouter>
			<ListItem note={note} />
		</MemoryRouter>,
	);

test("uses the first body line when the title is generated automatically", () => {
	renderItem({
		id: 3,
		title: "Note of 01 Aug, 2026",
		body: "Shopping\nMilk and coffee",
		updated: "2026-08-01T12:00:00Z",
	});

	expect(screen.getByText("Shopping")).toBeInTheDocument();
	expect(screen.getByText("Milk and coffee")).toBeInTheDocument();
	expect(screen.getByRole("link")).toHaveAttribute("href", "/notes/3");
});

test("keeps a custom title and normalizes the body preview", () => {
	renderItem({ id: 4, title: "Ideas", body: "  one\n\n two  " });

	expect(screen.getByText("Ideas")).toBeInTheDocument();
	expect(screen.getByText("one two")).toBeInTheDocument();
});

test("renders useful fallbacks for an empty note", () => {
	renderItem({ id: 5, title: "", body: "" });

	expect(screen.getByText("Untitled")).toBeInTheDocument();
	expect(screen.getByText("Empty note")).toBeInTheDocument();
});
