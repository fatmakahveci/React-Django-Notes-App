import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ReactComponent as LeftArrow } from '../assets/left_arrow.svg';

const Note = ({ props, history }) => {
    let { noteId } = useParams();
    let [ note, setNote ] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        getNote()
    }, [noteId]);

    let getNote = async () => {
        if (noteId === 'new') return

        let response = await fetch(`/notes/${noteId}/`)
        let data = await response.json()
        setNote(data)
    }

    let createNote = async () => {
        await fetch(`/notes/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
        })
    }

    let updateNote = async () => {
        await fetch(`/notes/${noteId}/`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(note)
        })
    }

    let deleteNote = async () => {
        if (noteId !== 'new') { 
            await fetch(`/notes/${noteId}`, {
                method: "DELETE",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(note)
            })
        }
        navigate('/')
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
        navigate('/')
    }

    return (
        <div className="note">
            <div className="note-header">
                <h3>
                    <Link to="/">
                        <LeftArrow onClick={handleSubmit} />
                    </Link>
                </h3>
                {noteId !== 'new' ? (<button onClick={deleteNote}>Delete</button>) : (<p></p>)}
            </div>
            <textarea onChange={(e)=> {setNote({ ...note, 'body': e.target.value })}} value={note?.body}></textarea>
        </div>
    )
}

export default Note