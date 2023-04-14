import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactComponent as LeftArrow } from "../assets/left_arrow.svg";
import axios from "axios";
import AuthContext from "../context/AuthContext";

const Note = () => {
  let { noteId } = useParams();
  let [note, setNote] = useState(null);
  const navigate = useNavigate();

  let { authTokens } = useContext(AuthContext);
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + String(authTokens.access),
    },
  };

  useEffect(() => {
    getNote(noteId);
  }, [noteId]);
  let getNote = async (noteId) => {
    if (noteId === "new") return;

    await axios.get(`/notes/${noteId}/`, config).then((response) => {
      setNote(response.data);
    });
  };

  let createNote = async () => {
    await axios.post("/notes/", note, config).then((response) => {
      setNote(response.data);
      navigate("/notes/");
    });
  };

  let updateNote = async () => {
    if (noteId === "new") return;

    await axios.post(`/notes/${noteId}/`, note, config).then((response) => {
      setNote(response.data);
      navigate("/notes/");
    });
  };

  let deleteNote = async () => {
    if (noteId === "new") return;

    axios
      .delete(`/notes/${noteId}/`, config)
      .then((response) => navigate("/notes/"));
  };

  let handleSubmit = () => {
    if (noteId !== "new") {
      if (!note.body) {
        deleteNote();
      } else {
        updateNote();
      }
    } else if (note !== null) {
      createNote();
    }
  };

  return (
    <div className="note">
      <div className="note-header">
        <h3>
          <button onClick={handleSubmit}>
            <LeftArrow />
          </button>
        </h3>
        {noteId !== "new" ? (
          <button onClick={deleteNote}>Delete</button>
        ) : (
          <p></p>
        )}
      </div>
      <textarea
        onChange={(e) => {
          setNote({ ...note, body: e.target.value });
        }}
        value={note?.body}
      ></textarea>
    </div>
  );
};

export default Note;
