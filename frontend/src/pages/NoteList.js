import React, { useState, useEffect } from 'react';
import ListItem from '../components/ListItem';
import AddButton from '../components/AddButton';
import axios from 'axios';

const NoteList = () => {
    let [notes, setNotes] = useState([])

    useEffect(() => { getNotes() }, [])

    let getNotes = async () => {
        await axios.get(`/notes/`)
                   .then(response => setNotes(response.data));
    }

    return (
        <div className='notes'>
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
    )
}

export default NoteList