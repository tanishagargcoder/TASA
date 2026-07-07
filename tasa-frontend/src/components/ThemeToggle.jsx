import { useState, useEffect } from "react";

export default function ThemeToggle({ className = "" }) {
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={`px-3 py-2 rounded-xl bg-white/50 dark:bg-gray-800/60 backdrop-blur-md border border-white/60 dark:border-gray-700 shadow hover:scale-105 transition text-lg ${className}`}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
