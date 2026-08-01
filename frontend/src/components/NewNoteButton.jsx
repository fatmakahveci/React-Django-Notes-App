import { useNavigate } from "react-router-dom";
import AddIcon from "../assets/add.svg?react";
import "./newnote.css";

const NewNoteButton = () => {
	const navigate = useNavigate();

	return (
		<button
			className="newnote-btn"
			onClick={() => navigate("/notes/new")}
			title="Create note"
		>
			<AddIcon />
		</button>
	);
};

export default NewNoteButton;
