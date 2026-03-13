import { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Notes() {

  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [color, setColor] = useState("bg-yellow-200");

  const API = `${API_URL}/api/notes`;

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    const res = await axios.get(API);
    setNotes(res.data || []);
  };

  const addNote = async () => {

    if (!text.trim()) return;

    const res = await axios.post(API, { text });

    const newNote = {
      ...res.data,
      pinned: false,
      color,
      createdAt: new Date()
    };

    setNotes([...notes, newNote]);
    setText("");
  };

  const deleteNote = async (id) => {
    await axios.delete(`${API}/${id}`);
    setNotes(notes.filter((n) => n._id !== id));
  };

  const togglePin = (id) => {
    setNotes(notes.map(n =>
      n._id === id ? { ...n, pinned: !n.pinned } : n
    ));
  };

  const startEdit = (note) => {
    setText(note.text);
    setEditingId(note._id);
  };

  const saveEdit = async () => {

    const res = await axios.put(`${API}/${editingId}`, { text });

    setNotes(notes.map(n =>
      n._id === editingId ? res.data : n
    ));

    setEditingId(null);
    setText("");
  };

  const filteredNotes = notes
    .filter(n =>
      (n.text || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div>

      <h2>Notes</h2>

      <input
        placeholder="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <input
        placeholder="Write note"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {editingId ? (
        <button onClick={saveEdit}>Save</button>
      ) : (
        <button onClick={addNote}>Add</button>
      )}

      {filteredNotes.map(note => (
        <div key={note._id}>
          {note.text}

          <button onClick={() => togglePin(note._id)}>📌</button>
          <button onClick={() => startEdit(note)}>Edit</button>
          <button onClick={() => deleteNote(note._id)}>Delete</button>

        </div>
      ))}

    </div>
  );
}