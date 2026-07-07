import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

const CATEGORIES = ["Food", "Travel", "Shopping", "Bills", "Other"];

const categoryEmoji = {
  Food: "🍔",
  Travel: "🚌",
  Shopping: "🛍️",
  Bills: "🧾",
  Other: "📦",
};

export default function Expense() {

  const [expenses, setExpenses] = useState([]);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

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
    } catch {
      setError("Could not save expense");
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    await axios.delete(`${API}/${id}`, authHeaders);
    setExpenses(expenses.filter(e => e._id !== id));
  };

  // Monthly summary
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date || e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const allTotal = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: thisMonth
      .filter(e => e.category === cat)
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
  })).filter(c => c.total > 0);

  return (
    <div className="fade-up">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Expenses 💸</h2>
        <span className="text-sm text-gray-600">{expenses.length} entries</span>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3">
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-5">
          <p className="text-sm text-gray-600">This Month</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">₹{monthTotal.toLocaleString("en-IN")}</p>
          {byCategory.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {byCategory.map(c => (
                <span
                  key={c.cat}
                  className="text-xs bg-white/60 border border-white/70 rounded-full px-3 py-1 text-gray-700"
                >
                  {categoryEmoji[c.cat]} {c.cat}: ₹{c.total.toLocaleString("en-IN")}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-5">
          <p className="text-sm text-gray-600">All Time</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">₹{allTotal.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Add form */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-5 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="number"
          min="0"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-36 p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
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
          className="flex-1 min-w-[150px] p-3 rounded-xl border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          onClick={addExpense}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300"
        >
          Add
        </button>
      </div>

      {/* Expense history */}
      {expenses.length === 0 && (
        <p className="text-gray-600">No expenses yet. Add your first expense above 🌸</p>
      )}

      <div className="space-y-3">
        {expenses.map(e => (
          <div
            key={e._id}
            className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow p-4 flex flex-wrap items-center gap-3"
          >
            <span className="text-2xl">{categoryEmoji[e.category] || "📦"}</span>

            <div className="flex-1 min-w-[150px]">
              <p className="font-medium text-gray-800">
                {e.category}{e.note ? ` — ${e.note}` : ""}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(e.date || e.createdAt).toLocaleDateString()}
              </p>
            </div>

            <span className="font-bold text-gray-800">
              ₹{Number(e.amount).toLocaleString("en-IN")}
            </span>

            <button
              onClick={() => deleteExpense(e._id)}
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
