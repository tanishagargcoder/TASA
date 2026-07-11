import { useState, useEffect, useCallback } from "react";
import Tasks from "./Tasks";
import Notes from "./Notes";
import Expense from "./Expense";
import Profile from "./Profile";
import ThemeToggle from "../components/ThemeToggle";
import { API_URL } from "../config";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Other"];

function heatColor(count) {
  if (count === 0) return "bg-white/40 dark:bg-white/10";
  if (count === 1) return "bg-rose-200 dark:bg-rose-900";
  if (count === 2) return "bg-rose-300 dark:bg-rose-700";
  if (count === 3) return "bg-rose-400 dark:bg-rose-600";
  return "bg-rose-500";
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const [active, setActive] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    monthExpense: 0,
    recentNotes: [],
    categoryTotals: [],
    last7Days: [],
    overdue: [],
    dueToday: [],
    heatDays: [],
    streak: 0,
    score: 0,
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
      const todayStart = new Date(now.toDateString());
      const monthExpenses = expenseList.filter((e) => {
        const d = new Date(e.date || e.createdAt);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      });
      const monthExpense = monthExpenses
        .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

      const categoryTotals = CATEGORIES.map((cat) => ({
        cat,
        total: monthExpenses
          .filter((e) => e.category === cat)
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0),
      })).filter((c) => c.total > 0);

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const day = new Date();
        day.setDate(day.getDate() - (6 - i));
        const total = expenseList
          .filter((e) => {
            const d = new Date(e.date || e.createdAt);
            return d.toDateString() === day.toDateString();
          })
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        return {
          label: day.toLocaleDateString("en-IN", { weekday: "short" }),
          total,
        };
      });

      // ===== Activity analytics: heatmap, streak, productivity score =====
      const dayKey = (d) => {
        const x = new Date(d);
        return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
      };

      const activity = {};
      const bump = (d) => {
        if (!d) return;
        const k = dayKey(d);
        activity[k] = (activity[k] || 0) + 1;
      };

      taskList.forEach((t) => bump(t.completedAt || (t.completed ? t.updatedAt : null)));
      noteList.forEach((n) => bump(n.createdAt));
      expenseList.forEach((e) => bump(e.date || e.createdAt));

      // Last 15 weeks of daily activity (ends today)
      const heatDays = [];
      for (let i = 7 * 15 - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        heatDays.push({
          count: activity[dayKey(d)] || 0,
          label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        });
      }

      // Streak: consecutive active days ending today (yesterday counts as grace)
      let streak = 0;
      const cursor = new Date();
      if (!activity[dayKey(cursor)]) cursor.setDate(cursor.getDate() - 1);
      while (activity[dayKey(cursor)]) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      }

      // Productivity score /100: 40 completion rate + 40 active days (last 7) + 20 streak
      const doneCount = taskList.filter((t) => t.completed).length;
      const completionPts = taskList.length > 0 ? (doneCount / taskList.length) * 40 : 0;
      let activeDays7 = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        if (activity[dayKey(d)]) activeDays7++;
      }
      const score = Math.round(
        completionPts + (activeDays7 / 7) * 40 + Math.min(streak, 10) * 2
      );

      const pendingWithDue = taskList.filter((t) => !t.completed && t.dueDate);
      const overdue = pendingWithDue.filter(
        (t) => new Date(t.dueDate) < todayStart
      );
      const dueToday = pendingWithDue.filter(
        (t) => new Date(t.dueDate).toDateString() === now.toDateString()
      );

      setStats({
        totalTasks: taskList.length,
        completedTasks: taskList.filter((t) => t.completed).length,
        monthExpense,
        recentNotes: noteList.slice(0, 3),
        categoryTotals,
        last7Days,
        overdue,
        dueToday,
        heatDays,
        streak,
        score,
      });
    } catch {
      // overview stats are best-effort; modules load their own data
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  useEffect(() => {
    if (active === "overview") fetchOverview();
  }, [active, fetchOverview]);

  const pendingTasks = stats.totalTasks - stats.completedTasks;

  const navigate = (key) => {
    setActive(key);
    setSidebarOpen(false);
  };

  const navItem = (key, label) => (
    <div
      onClick={() => navigate(key)}
      className={`p-3 rounded-xl cursor-pointer transition text-gray-700 dark:text-gray-200 ${
        active === key
          ? "bg-white/50 dark:bg-white/20 shadow"
          : "hover:bg-white/40 dark:hover:bg-white/10"
      }`}
    >
      {label}
    </div>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 m-4 rounded-3xl bg-white/70 md:bg-white/30 dark:bg-gray-900/90 dark:md:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-xl p-6 transform transition-transform duration-300 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-[120%]"
        }`}
      >
        <div className="mb-10 text-xl font-extrabold text-gray-800 dark:text-gray-100">
          TASA <span className="text-rose-500">✨</span>
        </div>

        <nav className="space-y-3">
          {navItem("overview", "Overview")}
          {navItem("tasks", "Tasks")}
          {navItem("notes", "Notes")}
          {navItem("expenses", "Expenses")}
          {navItem("profile", "Profile")}

          <div
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="p-3 rounded-xl text-red-500 dark:text-red-400 mt-10 cursor-pointer hover:bg-white/40 dark:hover:bg-white/10 transition"
          >
            Logout
          </div>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-5 sm:p-10 overflow-auto">

        <div className="flex items-start justify-between gap-3">
          <div>
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden mb-4 px-4 py-2 rounded-xl bg-white/50 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-gray-700 shadow text-gray-700 dark:text-gray-200 font-medium"
            >
              ☰ Menu
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
              {greeting()}{userName ? `, ${userName}` : ""} 👋
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mt-2">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long", day: "numeric", month: "long", year: "numeric"
              })} · Let’s manage everything smoothly today.
            </p>
          </div>

          <ThemeToggle />
        </div>

        {/* SCREEN SWITCH */}
        <div className="mt-10">

          {active === "overview" && loadingStats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg h-36"
                />
              ))}
            </div>
          )}

          {active === "overview" && !loadingStats && (
            <div className="fade-up">

              {/* Quick actions */}
              <div className="flex flex-wrap gap-3 mb-6">
                {[
                  { key: "tasks", label: "+ New Task" },
                  { key: "notes", label: "+ New Note" },
                  { key: "expenses", label: "+ Add Expense" },
                ].map((a) => (
                  <button
                    key={a.key}
                    onClick={() => navigate(a.key)}
                    className="px-5 py-2.5 rounded-xl bg-white/40 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/10 text-gray-700 dark:text-gray-200 font-medium shadow hover:shadow-lg hover:scale-105 hover:bg-white/60 dark:hover:bg-white/20 transition"
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* Reminders */}
              {(stats.overdue.length > 0 || stats.dueToday.length > 0) && (
                <div className="mb-6 space-y-3">
                  {stats.overdue.length > 0 && (
                    <div
                      onClick={() => navigate("tasks")}
                      className="cursor-pointer bg-red-100/70 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow"
                    >
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                        ⚠️ {stats.overdue.length} overdue task{stats.overdue.length > 1 ? "s" : ""}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
                        {stats.overdue.map((t) => t.title).join(" · ")}
                      </p>
                    </div>
                  )}

                  {stats.dueToday.length > 0 && (
                    <div
                      onClick={() => navigate("tasks")}
                      className="cursor-pointer bg-amber-100/70 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 shadow"
                    >
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                        ⏰ {stats.dueToday.length} task{stats.dueToday.length > 1 ? "s" : ""} due today
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 truncate">
                        {stats.dueToday.map((t) => t.title).join(" · ")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div
                  onClick={() => navigate("tasks")}
                  className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 dark:hover:bg-white/20 transition"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Tasks</p>
                  <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                    {stats.totalTasks}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {stats.completedTasks} done · {pendingTasks} pending
                  </p>
                </div>

                <div
                  onClick={() => navigate("expenses")}
                  className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 dark:hover:bg-white/20 transition"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-300">Expenses This Month</p>
                  <p className="text-4xl font-bold text-gray-800 dark:text-gray-100 mt-2">
                    ₹{stats.monthExpense.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Tap to see history
                  </p>
                </div>

                <div
                  onClick={() => navigate("notes")}
                  className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg cursor-pointer hover:bg-white/40 dark:hover:bg-white/20 transition"
                >
                  <p className="text-sm text-gray-600 dark:text-gray-300">Recent Notes</p>
                  {stats.recentNotes.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm">No notes yet</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {stats.recentNotes.map((n) => (
                        <li
                          key={n._id}
                          className="text-sm text-gray-700 dark:text-gray-200 truncate bg-white/40 dark:bg-white/10 rounded-lg px-3 py-1"
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
                <div className="mt-6 bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span>Task Progress</span>
                    <span>
                      {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(stats.completedTasks / stats.totalTasks) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Productivity score + streak */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">

                <div className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg flex items-center gap-5">
                  <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="10"
                      className="stroke-white/50 dark:stroke-white/10"
                    />
                    <circle
                      cx="50" cy="50" r="42" fill="none" strokeWidth="10"
                      stroke="#f43f5e" strokeLinecap="round"
                      strokeDasharray={`${(stats.score / 100) * 2 * Math.PI * 42} ${2 * Math.PI * 42}`}
                      transform="rotate(-90 50 50)"
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                    <text
                      x="50" y="57" textAnchor="middle" fontSize="24" fontWeight="700"
                      className="fill-gray-800 dark:fill-gray-100"
                    >
                      {stats.score}
                    </text>
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                      Productivity Score 🎯
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Based on task completion, active days this week and your streak.
                    </p>
                  </div>
                </div>

                <div className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg flex items-center gap-5">
                  <span className="text-5xl">🔥</span>
                  <div>
                    <p className="text-4xl font-bold text-gray-800 dark:text-gray-100">
                      {stats.streak} <span className="text-lg font-semibold">day{stats.streak !== 1 ? "s" : ""}</span>
                    </p>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-1">Current Streak</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.streak === 0
                        ? "Complete a task or add a note today to start one!"
                        : "Keep it going — do anything in TASA today."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Activity heatmap */}
              <div className="mt-6 bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg">
                <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Activity — Last 15 Weeks 🟩
                  </p>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    Less
                    {[0, 1, 2, 3, 4].map((c) => (
                      <span key={c} className={`w-3 h-3 rounded-sm ${heatColor(c)}`} />
                    ))}
                    More
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1">
                  {Array.from({ length: 15 }).map((_, w) => (
                    <div key={w} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }).map((_, d) => {
                        const day = stats.heatDays[w * 7 + d];
                        if (!day) return <span key={d} className="w-3.5 h-3.5" />;
                        return (
                          <span
                            key={d}
                            title={`${day.label}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                            className={`w-3.5 h-3.5 rounded-sm ${heatColor(day.count)} hover:ring-2 hover:ring-rose-400 transition`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Tasks completed, notes written and expenses logged — every action counts.
                </p>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

                {/* Spending by category — this month */}
                <div className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                    Spending by Category (This Month)
                  </p>

                  {stats.categoryTotals.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No expenses this month yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {stats.categoryTotals.map((c) => {
                        const max = Math.max(...stats.categoryTotals.map(x => x.total));
                        return (
                          <div key={c.cat}>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                              <span>{c.cat}</span>
                              <span>₹{c.total.toLocaleString("en-IN")}</span>
                            </div>
                            <div className="w-full h-2.5 bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-500"
                                style={{ width: `${(c.total / max) * 100}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Last 7 days spending */}
                <div className="bg-white/25 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 rounded-2xl shadow-lg">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                    Spending — Last 7 Days
                  </p>

                  {stats.last7Days.every((d) => d.total === 0) ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">No spending in the last 7 days.</p>
                  ) : (
                    <div className="flex items-end gap-2 h-32">
                      {stats.last7Days.map((d, i) => {
                        const max = Math.max(...stats.last7Days.map(x => x.total), 1);
                        return (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center justify-end h-full"
                            title={`${d.label}: ₹${d.total.toLocaleString("en-IN")}`}
                          >
                            <div
                              className="w-full max-w-[28px] bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-md transition-all duration-500 hover:opacity-80"
                              style={{
                                height: `${(d.total / max) * 100}%`,
                                minHeight: d.total > 0 ? "4px" : "0",
                              }}
                            />
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{d.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {active === "tasks" && <Tasks />}
          {active === "notes" && <Notes />}
          {active === "expenses" && <Expense />}
          {active === "profile" && <Profile />}

        </div>
      </div>
    </div>
  );
}
