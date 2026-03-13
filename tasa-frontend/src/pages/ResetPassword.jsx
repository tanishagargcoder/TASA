import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const { email, otp } = location.state || {};

  const handleReset = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword,
      });

      alert("Password reset successful 🎉");
      navigate("/login");
    } catch (error) {
      alert(error.response?.data?.message || "Reset failed");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <form
        onSubmit={handleReset}
        className="bg-white/40 backdrop-blur-xl border border-white/50 shadow-2xl p-10 rounded-3xl w-96"
      >
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Reset Password 🔐
        </h2>

        <input
          type="password"
          placeholder="Enter New Password"
          className="w-full p-3 rounded-xl mb-6 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}