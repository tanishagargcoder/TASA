import { Navigate } from "react-router-dom";

function isTokenValid(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds; treat missing exp as valid
    return !payload.exp || payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    return <Navigate to="/login" />;
  }

  return children;
}
