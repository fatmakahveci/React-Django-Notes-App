import React from "react";
import { NavLink } from "react-router-dom";

const ListItem = ({ note }) => {
  return (
    <div>
      <NavLink to={`/notes/${note.id}/`}>
        <div className="notes-list-item">
          <h3>{note.title}</h3>
          <p>{note.body}</p>
        </div>
      </NavLink>
    </div>
  );
};

export default ListItem;
