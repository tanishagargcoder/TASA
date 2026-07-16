import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={handleSubmit}
        className="bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3 text-center">
          Forgot Password
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          We'll email you a 6-digit OTP to reset it.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Enter your registered email"
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-300">
          <Link to="/login" className="text-rose-600 font-semibold">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}
