import { Link } from "react-router-dom";

const features = [
  {
    emoji: "✅",
    title: "Tasks",
    desc: "Add priorities & due dates, track progress and never miss a deadline.",
  },
  {
    emoji: "📝",
    title: "Notes",
    desc: "Capture ideas instantly, pin the important ones and search everything.",
  },
  {
    emoji: "💸",
    title: "Expenses",
    desc: "Log spending by category and see monthly summaries with charts.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Navbar */}
      <div className="flex justify-between items-center px-6 sm:px-10 py-6">
        <div className="text-2xl font-extrabold text-gray-800">
          TASA <span className="text-rose-500">✨</span>
        </div>

        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-5 py-2 rounded-xl bg-white/60 backdrop-blur-md border border-white/40 shadow-md hover:shadow-lg hover:scale-105 transition font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition font-medium"
          >
            Register
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="flex flex-1 items-center justify-center text-center px-6 py-16">
        <div className="fade-up">
          <span className="inline-block mb-6 px-4 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-white/60 text-sm text-gray-700 shadow">
            🌸 Track and Simplify Activities
          </span>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 leading-tight">
            Organize your life <br />
            the smart way ✨
          </h2>

          <p className="mt-4 text-gray-600 text-lg max-w-xl mx-auto">
            Tasks, notes & expenses — all in one beautiful place.
            Free, simple and made for your everyday.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
            >
              Get Started — it's free
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 text-gray-700 font-semibold shadow hover:shadow-lg hover:scale-105 transition"
            >
              I have an account
            </Link>
          </div>

          {/* Feature cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto text-left">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl shadow-lg p-6 hover:shadow-2xl hover:-translate-y-1 transition duration-300"
              >
                <div className="text-3xl">{f.emoji}</div>
                <h3 className="mt-3 text-lg font-bold text-gray-800">{f.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-gray-500">
        Made with 💖 · TASA — Track and Simplify Activities
      </footer>
    </div>
  );
}
