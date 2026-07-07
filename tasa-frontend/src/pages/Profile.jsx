import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";

export default function Profile() {

  const [user, setUser] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch {
      setMessage({ type: "error", text: "Could not load profile" });
    }
  }, [token]);

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

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile 👤</h2>

      {/* User info */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-6 mb-6 max-w-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            {user?.name ? user.name[0].toUpperCase() : "?"}
          </div>
          <div>
            <p className="text-xl font-semibold text-gray-800">{user?.name || "..."}</p>
            <p className="text-sm text-gray-600">{user?.email || ""}</p>
            {user?.createdAt && (
              <p className="text-xs text-gray-500 mt-1">
                Member since {new Date(user.createdAt).toLocaleDateString("en-IN", {
                  year: "numeric", month: "long"
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Change password */}
      <form
        onSubmit={changePassword}
        className="bg-white/30 backdrop-blur-xl border border-white/40 rounded-2xl shadow-lg p-6 max-w-xl"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password 🔒</h3>

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
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="New password (min 6 characters)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 bg-white/70 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 disabled:opacity-60 disabled:hover:scale-100"
        >
          {saving ? "Saving..." : "Update Password"}
        </button>
      </form>

    </div>
  );
}
