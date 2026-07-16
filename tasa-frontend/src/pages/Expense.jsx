import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Other"];

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
              {d.cat}
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
  const [editingId, setEditingId] = useState(null);
  const [budget, setBudget] = useState(0);
  const [error, setError] = useState("");
  const [month, setMonth] = useState("current"); // "current", "all", or "YYYY-M"
  const toast = useToast();

  const API = `${API_URL}/api/expenses`;
  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchExpenses = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [expRes, userRes] = await Promise.all([
        axios.get(API, { headers }),
        axios.get(`${API_URL}/api/auth/me`, { headers }),
      ]);
      setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      setBudget(Number(userRes.data?.monthlyBudget) || 0);
    } catch {
      setError("Could not load expenses");
    }
  }, [API, token]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const resetForm = () => {
    setAmount("");
    setNote("");
    setCategory("Food");
    setEditingId(null);
  };

  const saveExpense = async () => {
    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    setError("");

    try {
      if (editingId) {
        const res = await axios.put(
          `${API}/${editingId}`,
          { amount: Number(amount), category, note },
          authHeaders
        );
        setExpenses(expenses.map(e => (e._id === editingId ? res.data : e)));
        toast("Expense updated");
      } else {
        const res = await axios.post(
          API,
          { amount: Number(amount), category, note },
          authHeaders
        );
        setExpenses([res.data, ...expenses]);
        toast(`Expense added — ₹${Number(res.data.amount).toLocaleString("en-IN")}`);
      }
      resetForm();
    } catch {
      setError("Could not save expense");
    }
  };

  const startEdit = (e) => {
    setEditingId(e._id);
    setAmount(String(e.amount));
    setCategory(e.category || "Other");
    setNote(e.note || "");
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await axios.delete(`${API}/${id}`, authHeaders);
    setExpenses(expenses.filter(e => e._id !== id));
    toast("Expense deleted");
  };

  const exportCSV = (rows) => {
    if (rows.length === 0) {
      toast("Nothing to export", "error");
      return;
    }

    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      ["Date", "Category", "Note", "Amount (INR)"].join(","),
      ...rows.map(e => [
        esc(new Date(e.date || e.createdAt).toLocaleDateString("en-IN")),
        esc(e.category),
        esc(e.note),
        e.amount
      ].join(","))
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tasa-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("CSV downloaded");
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
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Expenses</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            Know exactly where your money goes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
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

          <button
            onClick={() => exportCSV(visible)}
            title="Download visible expenses as CSV"
            className="px-4 py-2 rounded-xl text-sm bg-white/40 dark:bg-white/10 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-white/20 transition"
          >
            Export CSV
          </button>
        </div>
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

        {/* Budget bar — current month only */}
        {budget > 0 && month === "current" && (
          <div className="mt-5 pt-4 border-t border-white/40 dark:border-white/10">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Monthly Budget</span>
              <span>
                ₹{periodTotal.toLocaleString("en-IN")} / ₹{budget.toLocaleString("en-IN")}
                {" "}({Math.round((periodTotal / budget) * 100)}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-white/40 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  periodTotal > budget
                    ? "bg-red-500"
                    : periodTotal > budget * 0.8
                    ? "bg-amber-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${Math.min((periodTotal / budget) * 100, 100)}%` }}
              />
            </div>
            {periodTotal > budget && (
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                Budget exceeded by ₹{(periodTotal - budget).toLocaleString("en-IN")}
              </p>
            )}
          </div>
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
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveExpense()}
          className={`flex-1 min-w-[150px] ${inputCls}`}
        />

        <button
          onClick={saveExpense}
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

      {/* Expense history */}
      {visible.length === 0 && (
        <p className="text-gray-600 dark:text-gray-300">No expenses in this period.</p>
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
              onClick={() => startEdit(e)}
              className="px-3 py-1 rounded-lg text-sm bg-white/60 dark:bg-gray-800/60 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-white/90 transition"
            >
              Edit
            </button>

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
