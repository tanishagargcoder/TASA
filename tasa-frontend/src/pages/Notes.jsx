import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const NOTE_COLORS = {
  yellow: {
    dot: "bg-yellow-300",
    card: "bg-yellow-100/70 border-yellow-200 dark:bg-yellow-900/40 dark:border-yellow-800",
  },
  rose: {
    dot: "bg-rose-300",
    card: "bg-rose-100/70 border-rose-200 dark:bg-rose-900/40 dark:border-rose-800",
  },
  blue: {
    dot: "bg-blue-300",
    card: "bg-blue-100/70 border-blue-200 dark:bg-blue-900/40 dark:border-blue-800",
  },
  green: {
    dot: "bg-green-300",
    card: "bg-green-100/70 border-green-200 dark:bg-green-900/40 dark:border-green-800",
  },
  purple: {
    dot: "bg-purple-300",
    card: "bg-purple-100/70 border-purple-200 dark:bg-purple-900/40 dark:border-purple-800",
  },
};

export default function Notes() {

  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [color, setColor] = useState("yellow");
  const [error, setError] = useState("");
  const toast = useToast();

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
      const res = await axios.post(API, { text, color }, authHeaders);
      setNotes([res.data, ...notes]);
      setText("");
      toast("Note added");
    } catch {
      setError("Could not save note");
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Delete this note?")) return;
    await axios.delete(`${API}/${id}`, authHeaders);
    setNotes(notes.filter((n) => n._id !== id));
    toast("Note deleted");
  };

  const togglePin = async (note) => {
    const res = await axios.put(
      `${API}/${note._id}`,
      { pinned: !note.pinned },
      authHeaders
    );
    setNotes(notes.map(n => (n._id === note._id ? res.data : n)));
    toast(res.data.pinned ? "Note pinned" : "Note unpinned");
  };

  const copyNote = async (note) => {
    try {
      await navigator.clipboard.writeText(note.text);
      toast("Copied to clipboard");
    } catch {
      toast("Could not copy", "error");
    }
  };

  const startEdit = (note) => {
    setText(note.text);
    setColor(note.color || "yellow");
    setEditingId(note._id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setText("");
  };

  const saveEdit = async () => {
    if (!text.trim()) return;

    const res = await axios.put(`${API}/${editingId}`, { text, color }, authHeaders);

    setNotes(notes.map(n =>
      n._id === editingId ? res.data : n
    ));

    setEditingId(null);
    setText("");
    toast("Note updated");
  };

  const filteredNotes = notes
    .filter(n =>
      (n.text || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const inputCls = "p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400";

  return (
    <div className="fade-up">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Notes</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Capture ideas before they fade.
          </p>
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-300">{notes.length} notes</span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Search */}
      <input
        placeholder="Search notes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`w-full mb-4 ${inputCls}`}
      />

      {/* Add / Edit form */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-5 mb-6">
        <div className="flex flex-wrap gap-3">
          <textarea
            placeholder="Write a note..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            className={`flex-1 min-w-[200px] resize-none ${inputCls}`}
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
                className="px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-white/80 transition"
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

        {/* Color picker */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-gray-600 dark:text-gray-300 mr-1">Color:</span>
          {Object.entries(NOTE_COLORS).map(([name, c]) => (
            <button
              key={name}
              onClick={() => setColor(name)}
              title={name}
              className={`w-6 h-6 rounded-full ${c.dot} border-2 transition hover:scale-110 ${
                color === name
                  ? "border-gray-700 dark:border-white scale-110"
                  : "border-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Notes grid */}
      {filteredNotes.length === 0 && (
        <p className="text-gray-600 dark:text-gray-300">
          {search ? "No notes match your search." : "No notes yet. Write your first note."}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredNotes.map(note => {
          const c = NOTE_COLORS[note.color] || NOTE_COLORS.yellow;
          return (
            <div
              key={note._id}
              className={`backdrop-blur-xl rounded-2xl shadow p-4 flex flex-col border ${c.card} ${
                note.pinned ? "ring-2 ring-rose-300 dark:ring-rose-700" : ""
              }`}
            >
              <p className="text-gray-800 dark:text-gray-100 flex-1 whitespace-pre-wrap break-words">
                {note.text}
              </p>

              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ""}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyNote(note)}
                    title="Copy note"
                    className="px-3 py-1 rounded-lg text-sm bg-white/70 border border-gray-300 text-gray-700 hover:bg-white dark:bg-gray-800/60 dark:border-gray-600 dark:text-gray-200 transition"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => togglePin(note)}
                    title={note.pinned ? "Unpin" : "Pin"}
                    className={`px-3 py-1 rounded-lg text-sm border transition ${
                      note.pinned
                        ? "bg-rose-200/80 border-rose-300 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/60 dark:border-rose-800 dark:text-rose-300"
                        : "bg-white/70 border-gray-300 text-gray-700 hover:bg-white dark:bg-gray-800/60 dark:border-gray-600 dark:text-gray-200"
                    }`}
                  >
                    {note.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => startEdit(note)}
                    className="px-3 py-1 rounded-lg text-sm bg-white/70 border border-gray-300 text-gray-700 hover:bg-white dark:bg-gray-800/60 dark:border-gray-600 dark:text-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteNote(note._id)}
                    className="px-3 py-1 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
