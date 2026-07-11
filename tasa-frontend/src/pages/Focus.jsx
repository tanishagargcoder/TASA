import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { API_URL } from "../config";
import { useToast } from "../context/ToastContext";

const PRESETS = [
  { label: "25 min", minutes: 25, break: 5 },
  { label: "50 min", minutes: 50, break: 10 },
];

// two soft beeps using WebAudio — no sound file needed
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.25);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.25);
    });
  } catch {
    // sound is best-effort
  }
}

export default function Focus() {

  const [preset, setPreset] = useState(PRESETS[0]);
  const [mode, setMode] = useState("work"); // "work" | "break"
  const [secondsLeft, setSecondsLeft] = useState(PRESETS[0].minutes * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState([]);
  const toast = useToast();
  const intervalRef = useRef(null);

  const token = localStorage.getItem("token");
  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const fetchSessions = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/focus`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      // stats are best-effort
    }
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const totalSeconds = mode === "work" ? preset.minutes * 60 : preset.break * 60;

  // countdown
  useEffect(() => {
    if (!running) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [running]);

  // live countdown in the browser tab title
  useEffect(() => {
    if (running) {
      const m = Math.floor(secondsLeft / 60);
      const s = String(secondsLeft % 60).padStart(2, "0");
      document.title = `${m}:${s} ${mode === "work" ? "⏳ Focus" : "☕ Break"} — TASA`;
    } else {
      document.title = "TASA — Track & Simplify Activities";
    }
    return () => {
      document.title = "TASA — Track & Simplify Activities";
    };
  }, [secondsLeft, running, mode]);

  // session finished
  useEffect(() => {
    if (secondsLeft !== 0 || !running) return;

    setRunning(false);
    beep();

    if (mode === "work") {
      axios.post(`${API_URL}/api/focus`, { minutes: preset.minutes }, authHeaders)
        .then(() => fetchSessions())
        .catch(() => {});
      toast(`Focus session done — ${preset.minutes} min logged! Take a ${preset.break} min break ☕`);
      setMode("break");
      setSecondsLeft(preset.break * 60);
    } else {
      toast("Break over — ready for the next round? 💪");
      setMode("work");
      setSecondsLeft(preset.minutes * 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);

  const reset = () => {
    setRunning(false);
    setMode("work");
    setSecondsLeft(preset.minutes * 60);
  };

  const choosePreset = (p) => {
    setPreset(p);
    setRunning(false);
    setMode("work");
    setSecondsLeft(p.minutes * 60);
  };

  // stats
  const dayKey = (d) => new Date(d).toDateString();
  const today = new Date().toDateString();
  const todayMinutes = sessions
    .filter((s) => dayKey(s.date) === today)
    .reduce((sum, s) => sum + s.minutes, 0);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekMinutes = sessions
    .filter((s) => new Date(s.date) >= weekAgo)
    .reduce((sum, s) => sum + s.minutes, 0);

  const fmtHours = (min) =>
    min >= 60 ? `${Math.floor(min / 60)}h ${min % 60}m` : `${min}m`;

  // ring geometry
  const R = 88;
  const C = 2 * Math.PI * R;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div className="fade-up">

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Focus ⏳</h2>
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Today: {fmtHours(todayMinutes)} · This week: {fmtHours(weekMinutes)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Timer card */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-8 flex flex-col items-center">

          {/* Preset picker */}
          <div className="flex gap-2 mb-6">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => choosePreset(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                  preset.minutes === p.minutes
                    ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow"
                    : "bg-white/50 dark:bg-white/10 text-gray-700 dark:text-gray-200 border border-white/60 dark:border-white/10 hover:bg-white/70"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Countdown ring */}
          <svg viewBox="0 0 200 200" className="w-56 h-56">
            <circle
              cx="100" cy="100" r={R} fill="none" strokeWidth="12"
              className="stroke-white/50 dark:stroke-white/10"
            />
            <circle
              cx="100" cy="100" r={R} fill="none" strokeWidth="12"
              stroke={mode === "work" ? "#f43f5e" : "#10b981"}
              strokeLinecap="round"
              strokeDasharray={`${progress * C} ${C}`}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dasharray 0.9s linear" }}
            />
            <text
              x="100" y="100" textAnchor="middle" fontSize="40" fontWeight="700"
              className="fill-gray-800 dark:fill-gray-100"
            >
              {mm}:{ss}
            </text>
            <text
              x="100" y="128" textAnchor="middle" fontSize="13"
              className="fill-gray-500 dark:fill-gray-400"
            >
              {mode === "work" ? "⏳ Focus time" : "☕ Break time"}
            </text>
          </svg>

          {/* Controls */}
          <div className="flex gap-3 mt-6">
            {!running ? (
              <button
                onClick={start}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
              >
                {secondsLeft === totalSeconds ? "Start" : "Resume"}
              </button>
            ) : (
              <button
                onClick={pause}
                className="px-8 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 font-semibold shadow hover:bg-white/80 transition"
              >
                Pause
              </button>
            )}
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-white/40 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-white/60 transition"
            >
              Reset
            </button>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
            Timer chalte waqt ye page khula rakhna — tab title me countdown dikhta rahega.
          </p>
        </div>

        {/* Stats card */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-5 text-center">
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{fmtHours(todayMinutes)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Focused Today</p>
            </div>
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-5 text-center">
              <p className="text-3xl font-bold text-gray-800 dark:text-gray-100">{fmtHours(weekMinutes)}</p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">This Week</p>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Recent Sessions</p>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sessions yet — start your first 25 minutes! 🌸
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">⏳ {s.minutes} min</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {new Date(s.date).toLocaleString("en-IN", {
                        day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
