import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import Notes from "./pages/Notes";
import Expense from "./pages/Expense";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
        <Routes>
          {/* Landing */}
          <Route path="/" element={<Landing />} />

          {/* Auth Pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
          path="/notes"
          element={
          <ProtectedRoute>
            <Notes />
            </ProtectedRoute>
          }
          />

          <Route
          path="/expenses"
          element={
          <ProtectedRoute>
            <Expense />
            </ProtectedRoute>
          }
          />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;