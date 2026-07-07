import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Notes() {

  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const API = `${API_URL}/api/notes`;
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchNotes = useCallback(async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotes(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Could not load notes");
    }
  }, [API, token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async () => {
    if (!text.trim()) return;
    setError("");

    try {
      const res = await axios.post(API, { text }, authHeaders);
      setNotes([res.data, ...notes]);
      setText("");
    } catch {
      setError("Could not save note");
    }
  };

  const deleteNote = async (id) => {
    await axios.delete(`${API}/${id}`, authHeaders);
    setNotes(notes.filter((n) => n._id !== id));
  };

  const togglePin = async (note) => {
    const res = await axios.put(
      `${API}/${note._id}`,
      { pinned: !note.pinned },
      authHeaders
    );
    setNotes(notes.map(n => (n._id === note._id ? res.data : n)));
  };

  const startEdit = (note) => {
    setText(note.text);
    setEditingId(note._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const saveEdit = async () => {
    if (!text.trim()) return;

    const res = await axios.put(`${API}/${editingId}`, { text }, authHeaders);

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

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Notes 📝</h2>
        <span className="text-sm text-gray-600">{notes.length} notes</span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {/* Search */}
      <input
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 rounded-xl mb-4 border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />

      {/* Add / Edit form */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-5 mb-6 flex flex-wrap gap-3">
        <textarea
          placeholder="Write a note..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="flex-1 min-w-[200px] p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
        />

        {editingId ? (
          <div className="flex gap-2">
            <button
              onClick={saveEdit}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
            >
              Save
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-3 rounded-xl bg-white/60 text-gray-700 border border-gray-300 hover:bg-white/80 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={addNote}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
          >
            Add
          </button>
        )}
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 && (
        <p className="text-gray-600">
          {search ? "No notes match your search." : "No notes yet. Write your first note 🌸"}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => (
          <div
            key={note._id}
            className={`backdrop-blur-xl rounded-2xl shadow p-4 flex flex-col ${
              note.pinned
                ? "bg-rose-100/70 border-2 border-rose-300"
                : "bg-yellow-100/70 border border-yellow-200"
            }`}
          >
            <p className="text-gray-800 flex-1 whitespace-pre-wrap break-words">
              {note.pinned && <span className="mr-1">📌</span>}
              {note.text}
            </p>

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">
                {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => togglePin(note)}
                  title={note.pinned ? "Unpin" : "Pin"}
                  className={`px-3 py-1 rounded-lg text-sm border transition ${
                    note.pinned
                      ? "bg-rose-200/80 border-rose-300 text-rose-700 hover:bg-rose-200"
                      : "bg-white/70 border-gray-300 text-gray-700 hover:bg-white"
                  }`}
                >
                  📌
                </button>
                <button
                  onClick={() => startEdit(note)}
                  className="px-3 py-1 rounded-lg text-sm bg-white/70 border border-gray-300 text-gray-700 hover:bg-white transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteNote(note._id)}
                  className="px-3 py-1 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
