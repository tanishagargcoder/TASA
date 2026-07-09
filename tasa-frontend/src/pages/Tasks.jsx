import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const priorityStyles = {
  High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800",
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
};

export default function Tasks() {

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const toast = useToast();

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
    setCategory("");
    setEditingId(null);
  };

  const saveTask = async () => {
    if (!title.trim()) return;
    setError("");

    const body = JSON.stringify({
      title,
      priority,
      dueDate: dueDate || null,
      category: category.trim()
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

      toast(editingId ? "Task updated ✏️" : "Task added ✅");
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
    setCategory(task.category || "");
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await fetch(`${API_URL}/api/tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });
    toast("Task deleted 🗑️");
    getTasks();
  };

  const clearCompleted = async () => {
    const done = tasks.filter(t => t.completed);
    if (done.length === 0) return;
    if (!window.confirm(`Delete all ${done.length} completed task${done.length > 1 ? "s" : ""}?`)) return;

    await Promise.all(done.map(t =>
      fetch(`${API_URL}/api/tasks/${t._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
    ));
    toast(`${done.length} completed task${done.length > 1 ? "s" : ""} cleared 🧹`);
    getTasks();
  };

  const toggleTask = async (task) => {
    await fetch(`${API_URL}/api/tasks/toggle/${task._id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!task.completed) toast("Task completed 🎉");
    getTasks();
  };

  const pending = tasks.filter(t => !t.completed).length;

  const isOverdue = (task) =>
    task.dueDate && !task.completed &&
    new Date(task.dueDate) < new Date(new Date().toDateString());

  const priorityRank = { High: 0, Medium: 1, Low: 2 };

  const visibleTasks = tasks
    .filter(t =>
      filter === "all" ? true :
      filter === "pending" ? !t.completed :
      t.completed
    )
    .filter(t => {
      const q = query.toLowerCase();
      return (t.title || "").toLowerCase().includes(q) ||
        (t.category || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      const p = (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1);
      if (p !== 0) return p;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      return a.dueDate ? -1 : b.dueDate ? 1 : 0;
    });

  const inputCls = "p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400";

  return (
    <div className="fade-up">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tasks ✅</h2>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {pending} pending · {tasks.length} total
        </span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Add / Edit form */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-5 mb-6 flex flex-wrap gap-3 items-center">
        <input
          value={title}
          placeholder="What needs to be done?"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveTask()}
          className={`flex-1 min-w-[200px] ${inputCls}`}
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={inputCls}
        >
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className={inputCls}
        />

        <input
          value={category}
          placeholder="Tag (e.g. Study)"
          onChange={(e) => setCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveTask()}
          className={`w-36 ${inputCls}`}
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
            className="px-4 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-white/80 transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <div className="flex gap-1 bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-xl p-1">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "done", label: "Done" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab.key
                  ? "bg-white/70 dark:bg-white/20 shadow text-gray-800 dark:text-gray-100"
                  : "text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          placeholder="Search tasks or tags..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`flex-1 min-w-[160px] py-2.5 ${inputCls}`}
        />

        {tasks.some(t => t.completed) && (
          <button
            onClick={clearCompleted}
            className="px-4 py-2.5 rounded-xl text-sm bg-white/40 dark:bg-white/10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/40 dark:hover:text-red-300 transition"
          >
            🧹 Clear Done
          </button>
        )}
      </div>

      {/* Task list */}
      {visibleTasks.length === 0 && (
        <p className="text-gray-600 dark:text-gray-300">
          {tasks.length === 0
            ? "No tasks yet. Add your first task above 🌸"
            : "No tasks match this filter."}
        </p>
      )}

      <div className="space-y-3">
        {visibleTasks.map(task => (
          <div
            key={task._id}
            className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-4 flex flex-wrap items-center gap-3"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTask(task)}
              className="w-5 h-5 accent-rose-500 cursor-pointer"
            />

            <div className="flex-1 min-w-[150px]">
              <p className={`font-medium ${task.completed ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
                {task.title}
              </p>
              {task.dueDate && (
                <p className={`text-xs mt-1 ${isOverdue(task) ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                  {isOverdue(task) && " · Overdue ⚠️"}
                </p>
              )}
            </div>

            {task.category && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800">
                #{task.category}
              </span>
            )}

            <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
              {task.priority || "Medium"}
            </span>

            <button
              onClick={() => startEdit(task)}
              className="px-3 py-1 rounded-lg text-sm bg-white/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white/90 transition"
            >
              Edit
            </button>

            <button
              onClick={() => deleteTask(task._id)}
              className="px-3 py-1 rounded-lg text-sm bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300 transition"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
