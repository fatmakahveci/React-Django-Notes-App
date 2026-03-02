import React from "react";
import { useNavigate } from "react-router-dom";
import { ReactComponent as Add } from "../assets/add.svg";
import "./add-button.css";

const AddButton = () => {
	const navigate = useNavigate();

	return (
		<button
			type="button"
			className="fab"
			onClick={() => navigate("/notes/new/")}
			aria-label="Create note"
			title="Create note"
		>
			<Add className="fab-icon" />
		</button>
	);
};

export default AddButton;
