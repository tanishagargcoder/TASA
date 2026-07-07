import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../config";

const priorityStyles = {
  High: "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low: "bg-green-100 text-green-700 border-green-200",
};

export default function Tasks() {

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const getTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load tasks");
    }
  }, [token]);

  useEffect(() => {
    getTasks();
  }, [getTasks]);

  const resetForm = () => {
    setTitle("");
    setPriority("Medium");
    setDueDate("");
    setEditingId(null);
  };

  const saveTask = async () => {
    if (!title.trim()) return;
    setError("");

    const body = JSON.stringify({
      title,
      priority,
      dueDate: dueDate || null
    });

    try {
      const url = editingId
        ? `${API_URL}/api/tasks/${editingId}`
        : `${API_URL}/api/tasks`;

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body
      });

      if (!res.ok) throw new Error();

      resetForm();
      getTasks();
    } catch {
      setError("Could not save task");
    }
  };

  const startEdit = (task) => {
    setEditingId(task._id);
    setTitle(task.title);
    setPriority(task.priority || "Medium");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
  };

  const deleteTask = async (id) => {
    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    getTasks();
  };

  const toggleTask = async (id) => {
    await fetch(`${API_URL}/api/tasks/toggle/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    getTasks();
  };

  const pending = tasks.filter(t => !t.completed).length;

  return (
    <div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tasks ✅</h2>
        <span className="text-sm text-gray-600">
          {pending} pending · {tasks.length} total
        </span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {/* Add / Edit form */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-5 mb-6 flex flex-wrap gap-3 items-center">
        <input
          value={title}
          placeholder="What needs to be done?"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveTask()}
          className="flex-1 min-w-[200px] p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={saveTask}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
        >
          {editingId ? "Save" : "Add"}
        </button>

        {editingId && (
          <button
            onClick={resetForm}
            className="px-4 py-3 rounded-xl bg-white/60 text-gray-700 border border-gray-300 hover:bg-white/80 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 && (
        <p className="text-gray-600">No tasks yet. Add your first task above 🌸</p>
      )}

      <div className="space-y-3">
        {tasks.map(task => (
          <div
            key={task._id}
            className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-4 flex flex-wrap items-center gap-3"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task._id)}
              className="w-5 h-5 accent-rose-500 cursor-pointer"
            />

            <div className="flex-1 min-w-[150px]">
              <p className={`font-medium ${task.completed ? "line-through text-gray-400" : "text-gray-800"}`}>
                {task.title}
              </p>
              {task.dueDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
              {task.priority || "Medium"}
            </span>

            <button
              onClick={() => startEdit(task)}
              className="px-3 py-1 rounded-lg text-sm bg-white/60 border border-gray-300 text-gray-700 hover:bg-white/90 transition"
            >
              Edit
            </button>

            <button
              onClick={() => deleteTask(task._id)}
              className="px-3 py-1 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
