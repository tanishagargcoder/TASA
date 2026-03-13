import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email,
      });

      alert("OTP sent to your email ✨");
      navigate("/verify-otp", { state: { email } });
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Forgot Password 💌
        </h2>

        <input
          type="email"
          placeholder="Enter your registered email"
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
        >
          Send OTP
        </button>

        <p className="mt-5 text-sm text-center text-gray-700">
          <Link to="/login" className="text-rose-600 font-semibold">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
}