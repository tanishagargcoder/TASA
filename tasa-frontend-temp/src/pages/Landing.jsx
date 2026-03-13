import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Navbar */}
      <div className="flex justify-end items-center px-10 py-6">
        <Link
          to="/login"
          className="px-5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 shadow-md hover:shadow-lg hover:scale-105 transition font-medium"
        >
          Login
        </Link>
      </div>

      {/* Hero */}
      <div className="flex flex-1 items-center justify-center text-center px-6">
        <div>
          <h2 className="text-5xl font-extrabold text-gray-800 leading-tight">
            Organize your life <br />
            the smart way ✨
          </h2>

          <p className="mt-4 text-gray-600 text-lg">
            Tasks, notes & expenses — all in one beautiful place.
          </p>

          <div className="mt-8">
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
