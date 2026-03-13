import { useState } from "react";
import Tasks from "./Tasks";
import Notes from "./Notes";
import Expense from "./Expense";

export default function Dashboard() {
  const [active, setActive] = useState("overview");

  return (
    <div className="flex h-screen bg-gradient-to-br from-purple-200 via-pink-100 to-indigo-200">
      
      {/* Sidebar */}
      <div className="w-64 m-4 rounded-3xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-xl p-6">
        <div className="mb-10 text-lg font-semibold text-gray-700">
          Menu
        </div>

        <nav className="space-y-3">
          
          <div
            onClick={() => setActive("overview")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "overview" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Overview
          </div>

          <div
            onClick={() => setActive("tasks")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "tasks" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Tasks
          </div>

          <div
            onClick={() => setActive("notes")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "notes" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Notes
          </div>

          <div
            onClick={() => setActive("expenses")}
            className={`p-3 rounded-xl cursor-pointer transition ${
              active === "expenses" ? "bg-white/50 shadow" : "hover:bg-white/40"
            }`}
          >
            Expenses
          </div>

          <div className="p-3 rounded-xl hover:bg-white/40 cursor-pointer">
            Profile
          </div>

          <div
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
            className="p-3 rounded-xl text-red-500 mt-10 cursor-pointer"
          >
            Logout
          </div>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 p-10 overflow-auto">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back
        </h1>

        <p className="text-gray-600 mt-2">
          Let’s manage everything smoothly today.
        </p>

        {/* SCREEN SWITCH */}
        <div className="mt-10">

          {active === "overview" && (
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-white/25 backdrop-blur-xl border border-white/40 p-6 rounded-2xl shadow-lg">
                Overview
              </div>
            </div>
          )}

          {active === "tasks" && <Tasks />}
          {active === "notes" && <Notes />}
          {active === "expenses" && <Expense />}

        </div>
      </div>
    </div>
  );
}