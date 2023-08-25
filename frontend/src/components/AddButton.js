import React from "react";
import { NavLink } from "react-router-dom";
import { ReactComponent as Add } from "../assets/add.svg";

const AddButton = () => {
  return (
    <NavLink to="/notes/new/" className="floating-button">
      <Add />
    </NavLink>
  );
};

export default AddButton;
