import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Profile() {

  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUser = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [userRes, tasksRes, notesRes, expensesRes] = await Promise.all([
        axios.get(`${API_URL}/api/auth/me`, { headers }),
        axios.get(`${API_URL}/api/tasks`, { headers }),
        axios.get(`${API_URL}/api/notes`, { headers }),
        axios.get(`${API_URL}/api/expenses`, { headers }),
      ]);
      setUser(userRes.data);
      setCounts({
        tasks: Array.isArray(tasksRes.data) ? tasksRes.data.length : 0,
        notes: Array.isArray(notesRes.data) ? notesRes.data.length : 0,
        expenses: Array.isArray(expensesRes.data) ? expensesRes.data.length : 0,
      });
    } catch {
      setMessage({ type: "error", text: "Could not load profile" });
    }
  }, [token]);

  const deleteAccount = async () => {
    if (!window.confirm("This will permanently delete your account and ALL your tasks, notes and expenses. Continue?")) return;

    const typed = window.prompt('Type "DELETE" to confirm:');
    if (typed !== "DELETE") return;

    try {
      await axios.delete(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem("token");
      window.location.href = "/";
    } catch {
      setMessage({ type: "error", text: "Could not delete account" });
    }
  };

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "New password must be at least 6 characters" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setSaving(true);
    try {
      await axios.post(
        `${API_URL}/api/auth/change-password`,
        { oldPassword, newPassword },
        authHeaders
      );
      setMessage({ type: "ok", text: "Password changed successfully ✨" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Could not change password"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fade-up">

      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Profile 👤</h2>

      {/* User info */}
      <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-6 mb-6 max-w-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {user?.name ? user.name[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800 dark:text-gray-100">{user?.name || "..."}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{user?.email || ""}</p>
            {user?.createdAt && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric", month: "long"
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Account stats */}
      {counts && (
        <div className="grid grid-cols-3 gap-4 mb-6 max-w-xl">
          {[
            { label: "Tasks", value: counts.tasks, emoji: "✅" },
            { label: "Notes", value: counts.notes, emoji: "📝" },
            { label: "Expenses", value: counts.expenses, emoji: "💸" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-4 text-center"
            >
              <p className="text-2xl">{s.emoji}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{s.value}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Change password */}
      <form
        onSubmit={changePassword}
        className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-6 max-w-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Change Password 🔒</h3>

        {message && (
          <p className={`mb-4 text-sm rounded-xl p-3 border ${
            message.type === "ok"
              ? "text-green-700 bg-green-100/70 border-green-200"
              : "text-red-600 bg-red-100/70 border-red-200"
          }`}>
            {message.text}
          </p>
        )}

        <input
          type="password"
          placeholder="Current password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="New password (min 6 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 dark:border-gray-600 bg-white/70 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 disabled:opacity-60 disabled:hover:scale-100"
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </form>

      {/* Danger zone */}
      <div className="mt-6 bg-red-50/60 dark:bg-red-900/20 backdrop-blur-xl border border-red-200 dark:border-red-900 rounded-2xl shadow-lg p-6 max-w-xl">
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-2">Danger Zone ⚠️</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Deleting your account removes all your tasks, notes and expenses permanently. This cannot be undone.
        </p>
        <button
          onClick={deleteAccount}
          className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-lg transition"
        >
          Delete My Account
        </button>
      </div>

    </div>
  );
}
