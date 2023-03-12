import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'
import { ReactComponent as LeftArrow } from '../assets/left_arrow.svg';
import axios from 'axios';

const Note = () => {
    let { noteId } = useParams();
    let [ note, setNote ] = useState(null);
    const navigate = useNavigate();

    useEffect(() => { getNote(noteId) }, [noteId]);

    let getNote = async (noteId) => {
        if (noteId === 'new') return

        await axios.get(`/notes/${noteId}/`)
                   .then(response => setNote(response.data));
    }

    let createNote = async () => {
        await axios.post('/notes/', note)
                   .then(response => {
                        setNote(response.data)
                        navigate('/notes/')
                    });
    }

    let updateNote = async () => {
        await axios.post(`/notes/${noteId}/`, note)
                   .then(response => {
                        setNote(response.data)
                        navigate('/notes/')
                   });
    }

    let deleteNote = async () => {
        if (noteId === 'new') return

        axios.delete(`/notes/${noteId}/`)
             .then(response => navigate('/notes/'));
    }

    let handleSubmit = () => {
        if (noteId !== 'new') {
            if (!note.body) {
                deleteNote()
            } else {
                updateNote()
            }
        } else if (note !== null){
            createNote()
        }
    }

    return (
        <div className="note">
            <div className="note-header">
                <h3>
                    <button onClick={handleSubmit}><LeftArrow /></button>
                </h3>
                {noteId !== 'new' ? (<button onClick={deleteNote}>Delete</button>) : (<p></p>)}
            </div>
            <textarea onChange={(e)=> {setNote({ ...note, 'body': e.target.value })}} value={note?.body}></textarea>
        </div>
    )
}

export default Note