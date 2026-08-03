import { NavLink } from "../router";
import Add from "../assets/add.svg?react";

const AddButton = () => {
	return (
		<NavLink
			to="/notes/new"
			className="floating-button"
			aria-label="Add note"
		>
			<Add />
		</NavLink>
	);
};

export default AddButton;
