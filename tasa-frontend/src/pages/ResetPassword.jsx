import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const { email, otp } = location.state || {};

  // Direct URL open without verified OTP → start over
  if (!email || !otp) {
    return <Navigate to="/forgot-password" />;
  }

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={handleReset}
        className="bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Reset Password
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="relative mb-4">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Enter New Password"
            className="w-full p-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            title={showPass ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showPass ? "Hide" : "Show"}
          </button>
        </div>

        <input
          type={showPass ? "text" : "password"}
          placeholder="Confirm New Password"
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
