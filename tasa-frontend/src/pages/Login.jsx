import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        { email, password }
      );

      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={handleLogin}
        className="bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Welcome back
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 text-center">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative mb-6">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Password"
            className="w-full p-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-300">
          <Link to="/forgot-password" className="font-semibold text-rose-600">
            Forgot password?
          </Link>
        </p>

        <p className="mt-2 text-sm text-center text-gray-700 dark:text-gray-300">
          New to TASA?{" "}
          <Link to="/register" className="font-semibold text-rose-600">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
