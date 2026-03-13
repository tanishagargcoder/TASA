import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../config";

export default function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {

    e.preventDefault();

    const res = await axios.post(
      `${API_URL}/api/auth/login`,
      { email, password }
    );

    localStorage.setItem("token", res.data.token);

    navigate("/dashboard");
  };

  return (
    <div>

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin}>Login</button>

    </div>
  );
}