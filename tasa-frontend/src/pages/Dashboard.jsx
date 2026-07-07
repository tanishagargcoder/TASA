import { useState, useEffect, useCallback } from "react";
import Tasks from "./Tasks";
import Notes from "./Notes";
import Expense from "./Expense";
import { API_URL } from "../config";

export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    monthExpense: 0,
    recentNotes: [],
  });

  const token = localStorage.getItem("token");

  const fetchOverview = useCallback(async () => {
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [userRes, tasksRes, notesRes, expensesRes] = await Promise.all([
        fetch(`${API_URL}/api/auth/me`, { headers }),
        fetch(`${API_URL}/api/tasks`, { headers }),
        fetch(`${API_URL}/api/notes`, { headers }),
        fetch(`${API_URL}/api/expenses`, { headers }),
      ]);

      const user = await userRes.json();
      const tasks = await tasksRes.json();
      const notes = await notesRes.json();
      const expenses = await expensesRes.json();

      if (user?.name) setUserName(user.name);

      const taskList = Array.isArray(tasks) ? tasks : [];
      const noteList = Array.isArray(notes) ? notes : [];
      const expenseList = Array.isArray(expenses) ? expenses : [];

      const now = new Date();
      const monthExpense = expenseList
        .filter((e) => {
          const d = new Date(e.date || e.createdAt);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        })
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      setStats({
        totalTasks: taskList.length,
        completedTasks: taskList.filter((t) => t.completed).length,
        monthExpense,
        recentNotes: noteList.slice(0, 3),
      });
    } catch {
      // overview stats are best-effort; modules load their own data
    }
  }, [token]);

  useEffect(() => {
    if (active === "overview") fetchOverview();
  }, [active, fetchOverview]);

  const pendingTasks = stats.totalTasks - stats.completedTasks;

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200">

      {/* Sidebar */}
      <div className="w-64 m-4 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl p-6">
        <div className="mb-10 text-lg font-semibold text-gray-700">
          Menu
        </div>

        <nav className="space-y-3">

          <div
            onClick={() => setActive("overview")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "overview" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Overview
          </div>

          <div
            onClick={() => setActive("tasks")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "tasks" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Tasks
          </div>

          <div
            onClick={() => setActive("notes")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "notes" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Notes
          </div>

          <div
            onClick={() => setActive("expenses")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "expenses" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Expenses
          </div>

          <div
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="p-3 rounded-xl text-red-500 mt-10 cursor-pointer hover:bg-white/40 transition"
          >
            Logout
          </div>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-10 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back{userName ? `, ${userName}` : ""} 👋
        </h1>

        <p className="text-gray-600 mt-2">
          Let’s manage everything smoothly today.
        </p>

        {/* SCREEN SWITCH */}
        <div className="mt-10">

          {active === "overview" && (
            <div>
              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  onClick={() => setActive("tasks")}
                  className="bg-white/25 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 transition"
                >
                  <p className="text-sm text-gray-600">Total Tasks</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">
                    {stats.totalTasks}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.completedTasks} done · {pendingTasks} pending
                  </p>
                </div>

                <div
                  onClick={() => setActive("expenses")}
                  className="bg-white/25 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 transition"
                >
                  <p className="text-sm text-gray-600">Expenses This Month</p>
                  <p className="text-4xl font-bold text-gray-800 mt-2">
                    ₹{stats.monthExpense.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Tap to see history
                  </p>
                </div>

                <div
                  onClick={() => setActive("notes")}
                  className="bg-white/25 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 transition"
                >
                  <p className="text-sm text-gray-600">Recent Notes</p>
                  {stats.recentNotes.length === 0 ? (
                    <p className="text-gray-500 mt-3 text-sm">No notes yet</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {stats.recentNotes.map((n) => (
                        <li
                          key={n._id}
                          className="text-sm text-gray-700 truncate bg-white/40 rounded-lg px-3 py-1"
                        >
                          {n.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Task progress bar */}
              {stats.totalTasks > 0 && (
                <div className="mt-6 bg-white/25 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-lg">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Task Progress</span>
                    <span>
                      {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.completedTasks / stats.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {active === "tasks" && <Tasks />}
          {active === "notes" && <Notes />}
          {active === "expenses" && <Expense />}

        </div>
      </div>
    </div>
  );
}
