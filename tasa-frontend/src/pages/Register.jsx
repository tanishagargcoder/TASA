import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

function passwordStrength(pass) {
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 10) score++;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score++;
  if (/\d/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { label: "Weak", width: "33%", color: "bg-red-500" };
  if (score <= 3) return { label: "Medium", width: "66%", color: "bg-amber-500" };
  return { label: "Strong", width: "100%", color: "bg-green-500" };
}

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = password ? passwordStrength(password) : null;

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });

      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <form
        onSubmit={handleRegister}
        className="bg-white/40 dark:bg-gray-900/60 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 dark:text-gray-100 mb-6 text-center">
          Join TASA ✨
        </h2>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-100/70 border border-red-200 rounded-xl p-3 text-center dark:bg-red-900/40 dark:border-red-800 dark:text-red-300">
            {error}
          </p>
        )}

        <input
          type="text"
          placeholder="Full Name"
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email Address"
          className="w-full p-3 rounded-xl mb-4 border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative mb-2">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Create Password"
            className="w-full p-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-800/70 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            title={showPass ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-lg opacity-70 hover:opacity-100"
          >
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Password strength meter */}
        {strength ? (
          <div className="mb-6">
            <div className="w-full h-1.5 bg-white/50 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              Password strength: <span className="font-semibold">{strength.label}</span>
            </p>
          </div>
        ) : (
          <div className="mb-6" />
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition duration-300 disabled:opacity-60 disabled:hover:scale-100"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="mt-5 text-sm text-center text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-rose-600">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
