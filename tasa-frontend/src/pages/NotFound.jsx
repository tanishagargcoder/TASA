import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <p className="text-7xl mb-4">🌸</p>
      <h1 className="text-6xl font-extrabold text-gray-800 dark:text-gray-100">404</h1>
      <p className="mt-3 text-lg text-gray-600 dark:text-gray-300">
        Oops! This page doesn't exist.
      </p>
      <Link
        to="/"
        className="mt-8 px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
      >
        Back to Home
      </Link>
    </div>
  );
}
