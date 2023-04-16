import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import AddButton from "../components/AddButton";
import ListItem from "../components/ListItem";
import AuthContext from "../context/AuthContext";

const NoteList = () => {
  let [notes, setNotes] = useState([]);

  let { authTokens } = useContext(AuthContext);
  
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + String(authTokens.access),
    },
  };

  useEffect(() => {
    getNotes();
  }, []);

  let getNotes = async () => {
    await axios
      .get(`/notes/`, config)
      .then((response) => setNotes(response.data));
  };

  return (
    <div className="notes">
      <div className="notes-header">
        <p className="notes-count">Number of notes: {notes.length}</p>
      </div>
      <div className="notes-list">
        {notes.map((note, index) => (
          <ListItem key={index} note={note} />
        ))}
      </div>
      <AddButton />
    </div>
  );
};

export default NoteList;
