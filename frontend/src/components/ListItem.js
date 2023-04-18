import React from "react";
import { Link } from "react-router-dom";

const ListItem = ({ note }) => {
  return (
    <div>
      <Link to={`/notes/${note.id}/`}>
        <div className="notes-list-item">
          <h3>{note.title}</h3>
          <p>{note.body}</p>
        </div>
      </Link>
    </div>
  );
};

export default ListItem;
