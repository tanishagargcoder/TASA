import { useState } from "react";
import { useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;

  // Direct URL open without email → start over
  if (!email) {
    return <Navigate to="/forgot-password" />;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/auth/verify-otp`, {
        email,
        otp,
      });

      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={handleVerify}
        className="bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-3 text-center">
          Verify OTP ✨
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-300 text-center mb-6">
          OTP sent to <span className="font-semibold">{email}</span>
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
            {error}
          </p>
        )}

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit OTP"
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400 text-center text-xl tracking-[0.5em]"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-300">
          Didn't get it?{" "}
          <Link to="/forgot-password" className="text-rose-600 font-semibold">
            Resend OTP
          </Link>
        </p>
      </form>
    </div>
  );
}
