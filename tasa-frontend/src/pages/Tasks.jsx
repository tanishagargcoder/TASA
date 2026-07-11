import { useEffect, useState, useCallback } from "react";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const COLUMNS = [
  { key: "todo", label: "📋 To Do", bar: "bg-blue-400" },
  { key: "inprogress", label: "⚡ In Progress", bar: "bg-amber-400" },
  { key: "done", label: "✅ Done", bar: "bg-green-400" },
];

// Old tasks (created before the board existed) have no status field
const statusOf = (t) => t.status || (t.completed ? "done" : "todo");

const priorityStyles = {
  High: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800",
  Medium: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-800",
  Low: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
};

export default function Tasks() {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [editingId, setEditingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState(
    () => localStorage.getItem("taskView") || "list"
  );
  const toast = useToast();

  const switchView = (v) => {
    setView(v);
    localStorage.setItem("taskView", v);
  };

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
    setDescription("");
    setPriority("Medium");
    setDueDate("");
    setCategory("");
    setRecurrence("none");
    setEditingId(null);
  };

  const saveTask = async () => {
    if (!title.trim()) return;
    setError("");

    const body = JSON.stringify({
      title,
      description: description.trim(),
      priority,
      dueDate: dueDate || null,
      category: category.trim(),
      recurrence
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
    setDescription(task.description || "");
    setPriority(task.priority || "Medium");
    setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
    setCategory(task.category || "");
    setRecurrence(task.recurrence || "none");
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

  const moveTask = async (task, newStatus) => {
    if (statusOf(task) === newStatus) return;

    // optimistic update so drag feels instant
    setTasks(tasks.map(t =>
      t._id === task._id
        ? { ...t, status: newStatus, completed: newStatus === "done" }
        : t
    ));

    await fetch(`${API_URL}/api/tasks/${task._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (newStatus === "done") {
      toast(
        task.recurrence && task.recurrence !== "none"
          ? `Task completed 🎉 Next ${task.recurrence} one created 🔁`
          : "Task completed 🎉"
      );
    }
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
    if (!task.completed) {
      toast(
        task.recurrence && task.recurrence !== "none"
          ? `Task completed 🎉 Next ${task.recurrence} one created 🔁`
          : "Task completed 🎉"
      );
    }
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

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Tasks ✅</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Plan, prioritize and get things done.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {pending} pending · {tasks.length} total
          </span>

          {/* List / Board toggle */}
          <div className="flex gap-1 bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-xl p-1">
            {[
              { key: "list", label: "☰ List" },
              { key: "board", label: "▦ Board" },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => switchView(v.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  view === v.key
                    ? "bg-white/70 dark:bg-white/20 shadow text-gray-800 dark:text-gray-100"
                    : "text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-white/10"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
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

        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          title="Repeat this task"
          className={inputCls}
        >
          <option value="none">No repeat</option>
          <option value="daily">🔁 Daily</option>
          <option value="weekly">🔁 Weekly</option>
          <option value="monthly">🔁 Monthly</option>
        </select>

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

        <input
          value={description}
          placeholder="Description (optional)"
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveTask()}
          className={`w-full ${inputCls}`}
        />
      </div>

      {view === "list" && (<>
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
              {task.description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                  {task.description}
                </p>
              )}
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

            {task.recurrence && task.recurrence !== "none" && (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800 capitalize">
                🔁 {task.recurrence}
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
      </>)}

      {/* Kanban board */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map(col => {
            const colTasks = tasks.filter(t => statusOf(t) === col.key);
            const colIndex = COLUMNS.findIndex(c => c.key === col.key);

            return (
              <div
                key={col.key}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData("text/plain");
                  const t = tasks.find(x => x._id === id);
                  if (t) moveTask(t, col.key);
                }}
                className="bg-white/20 dark:bg-white/5 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-3 min-h-[260px]"
              >
                <div className={`h-1.5 rounded-full ${col.bar} mb-3`} />

                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                    {col.label}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colTasks.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-6">
                      Drop tasks here
                    </p>
                  )}

                  {colTasks.map(task => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", task._id)}
                      className="bg-white/50 dark:bg-gray-800/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-xl shadow p-3 cursor-grab active:cursor-grabbing hover:shadow-lg transition"
                    >
                      <p className={`text-sm font-medium ${col.key === "done" ? "line-through text-gray-400 dark:text-gray-500" : "text-gray-800 dark:text-gray-100"}`}>
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${priorityStyles[task.priority] || priorityStyles.Medium}`}>
                          {task.priority || "Medium"}
                        </span>
                        {task.category && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 dark:border-indigo-800">
                            #{task.category}
                          </span>
                        )}
                        {task.recurrence && task.recurrence !== "none" && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/50 dark:text-purple-300 dark:border-purple-800 capitalize">
                            🔁 {task.recurrence}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`text-[10px] ${isOverdue(task) ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}>
                            📅 {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Move arrows (works on mobile where drag doesn't) */}
                      <div className="flex justify-between items-center mt-2">
                        <button
                          onClick={() => colIndex > 0 && moveTask(task, COLUMNS[colIndex - 1].key)}
                          disabled={colIndex === 0}
                          title="Move left"
                          className="px-2 py-0.5 rounded-lg text-xs bg-white/60 dark:bg-white/10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white transition"
                        >
                          ◀
                        </button>

                        <div className="flex gap-1">
                          <button
                            onClick={() => startEdit(task)}
                            className="px-2 py-0.5 rounded-lg text-xs bg-white/60 dark:bg-white/10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-white transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteTask(task._id)}
                            className="px-2 py-0.5 rounded-lg text-xs bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-300 hover:bg-red-100 transition"
                          >
                            🗑️
                          </button>
                        </div>

                        <button
                          onClick={() => colIndex < COLUMNS.length - 1 && moveTask(task, COLUMNS[colIndex + 1].key)}
                          disabled={colIndex === COLUMNS.length - 1}
                          title="Move right"
                          className="px-2 py-0.5 rounded-lg text-xs bg-white/60 dark:bg-white/10 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-30 hover:bg-white transition"
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
