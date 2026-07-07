import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Other"];

const categoryEmoji = {
  Food: "🍔",
  Travel: "🚌",
  Shopping: "🛍️",
  Bills: "🧾",
  Other: "📦",
};

// CVD-validated categorical palette (passes light & dark checks)
const categoryColor = {
  Food: "#e11d48",
  Travel: "#2563eb",
  Shopping: "#d97706",
  Bills: "#7c3aed",
  Other: "#059669",
};

// Donut chart: SVG stroke segments with 2px surface gaps, legend carries identity
function DonutChart({ data, total }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  const GAP = 2;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 120 120" className="w-36 h-36 shrink-0">
        {data.map((d) => {
          const frac = d.total / total;
          const len = Math.max(frac * C - GAP, 1);
          const seg = (
            <circle
              key={d.cat}
              cx="60"
              cy="60"
              r={R}
              fill="none"
              stroke={categoryColor[d.cat]}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 60 60)"
            >
              <title>{`${d.cat}: ₹${d.total.toLocaleString("en-IN")}`}</title>
            </circle>
          );
          offset += frac * C;
          return seg;
        })}
        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="fill-gray-800 dark:fill-gray-100"
          fontSize="13"
          fontWeight="700"
        >
          ₹{total.toLocaleString("en-IN")}
        </text>
        <text
          x="60"
          y="72"
          textAnchor="middle"
          className="fill-gray-500 dark:fill-gray-400"
          fontSize="8"
        >
          total
        </text>
      </svg>

      {/* Legend — identity never rides on color alone */}
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.cat} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: categoryColor[d.cat] }}
            />
            <span className="text-gray-700 dark:text-gray-200">
              {categoryEmoji[d.cat]} {d.cat}
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              ₹{d.total.toLocaleString("en-IN")} ({Math.round((d.total / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Expense() {

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [month, setMonth] = useState("current"); // "current", "all", or "YYYY-M"
  const toast = useToast();

  const API = `${API_URL}/api/expenses`;
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Could not load expenses");
    }
  }, [API, token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const addExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");

    try {
      const res = await axios.post(
        API,
        { amount: Number(amount), category, note },
        authHeaders
      );

      setExpenses([res.data, ...expenses]);
      setAmount("");
      setNote("");
      toast(`Expense added — ₹${Number(res.data.amount).toLocaleString("en-IN")} 💸`);
    } catch {
      setError("Could not save expense");
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await axios.delete(`${API}/${id}`, authHeaders);
    setExpenses(expenses.filter(e => e._id !== id));
    toast("Expense deleted 🗑️");
  };

  // Month options: current + previous 5 months + all time
  const now = new Date();
  const monthOptions = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    };
  });

  const matchesMonth = (e) => {
    if (month === "all") return true;
    const d = new Date(e.date || e.createdAt);
    const key = month === "current"
      ? `${now.getFullYear()}-${now.getMonth()}`
      : month;
    return `${d.getFullYear()}-${d.getMonth()}` === key;
  };

  const visible = expenses.filter(matchesMonth);
  const periodTotal = visible.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: visible
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  })).filter(c => c.total > 0);

  const inputCls = "p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400";

  return (
    <div className="fade-up">

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Expenses 💸</h2>

        {/* Month selector */}
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={inputCls + " py-2"}
        >
          <option value="current">This Month</option>
          {monthOptions.slice(1).map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
          <option value="all">All Time</option>
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Summary + chart */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {month === "all" ? "All-time" : month === "current" ? "This month's" : "Selected month's"} spending
          </p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            ₹{periodTotal.toLocaleString("en-IN")}
          </p>
        </div>

        {byCategory.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No expenses in this period.</p>
        ) : (
          <DonutChart data={byCategory} total={periodTotal} />
        )}
      </div>

      {/* Add form */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-5 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="number"
          min="0"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={`w-36 ${inputCls}`}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{categoryEmoji[cat]} {cat}</option>
          ))}
        </select>

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addExpense()}
          className={`flex-1 min-w-[150px] ${inputCls}`}
        />

        <button
          onClick={addExpense}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
        >
          Add
        </button>
      </div>

      {/* Expense history */}
      {visible.length === 0 && (
        <p className="text-gray-600 dark:text-gray-300">No expenses in this period 🌸</p>
      )}

      <div className="space-y-3">
        {visible.map(e => (
          <div
            key={e._id}
            className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-4 flex flex-wrap items-center gap-3"
          >
            <span
              className="w-2 h-8 rounded-full shrink-0"
              style={{ background: categoryColor[e.category] || categoryColor.Other }}
            />
            <span className="text-2xl">{categoryEmoji[e.category] || "📦"}</span>

            <div className="flex-1 min-w-[150px]">
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {e.category}{e.note ? ` — ${e.note}` : ""}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {new Date(e.date || e.createdAt).toLocaleDateString()}
              </p>
            </div>

            <span className="font-bold text-gray-800 dark:text-gray-100">
              ₹{Number(e.amount).toLocaleString("en-IN")}
            </span>

            <button
              onClick={() => deleteExpense(e._id)}
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
