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

const fmtHours = (min) =>
  min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}m` : ""}`.trim() : `${min}m`;

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
      document.title = `${m}:${s} ${mode === "work" ? "• Focus" : "• Break"} — TASA`;
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
      toast(`${preset.minutes} min focus session logged — time for a ${preset.break} min break ☕`);
      setMode("break");
      setSecondsLeft(preset.break * 60);
    } else {
      toast("Break over — ready for the next session 💪");
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

  // ===== stats =====
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

  const totalMinutes = sessions.reduce((sum, s) => sum + s.minutes, 0);

  // last 7 days, oldest → newest
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const minutes = sessions
      .filter((s) => dayKey(s.date) === d.toDateString())
      .reduce((sum, s) => sum + s.minutes, 0);
    return {
      label: d.toLocaleDateString("en-IN", { weekday: "short" }),
      minutes,
    };
  });
  const maxDay = Math.max(...last7.map((d) => d.minutes), 1);

  // ring geometry
  const R = 88;
  const C = 2 * Math.PI * R;
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;
  const mm = Math.floor(secondsLeft / 60);
  const ss = String(secondsLeft % 60).padStart(2, "0");

  const statTile = (value, label) => (
    <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-4 text-center">
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{label}</p>
    </div>
  );

  return (
    <div className="fade-up">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Focus ⏳</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Deep work, one session at a time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Timer card */}
        <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg p-8 flex flex-col items-center">

          {/* Mode indicator */}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-5 ${
            mode === "work"
              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
          }`}>
            {mode === "work" ? "FOCUS SESSION" : "BREAK"}
          </span>

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
                {p.label} <span className="opacity-70">+ {p.break} break</span>
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
              x="100" y="106" textAnchor="middle" fontSize="42" fontWeight="700"
              className="fill-gray-800 dark:fill-gray-100"
            >
              {mm}:{ss}
            </text>
          </svg>

          {/* Controls */}
          <div className="flex gap-3 mt-6">
            {!running ? (
              <button
                onClick={start}
                className="px-10 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition"
              >
                {secondsLeft === totalSeconds ? "Start" : "Resume"}
              </button>
            ) : (
              <button
                onClick={pause}
                className="px-10 py-3 rounded-xl bg-white/60 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 font-semibold shadow hover:bg-white/80 transition"
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

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-5 text-center">
            Keep this tab open while the timer runs — the countdown stays visible in the tab title.
          </p>
        </div>

        {/* Stats column */}
        <div className="space-y-6">

          <div className="grid grid-cols-3 gap-4">
            {statTile(fmtHours(todayMinutes), "Today")}
            {statTile(fmtHours(weekMinutes), "This Week")}
            {statTile(fmtHours(totalMinutes), "All Time")}
          </div>

          {/* Last 7 days chart */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-5">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
              Focus — Last 7 Days
            </p>

            {weekMinutes === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No sessions this week yet — start your first one.
              </p>
            ) : (
              <div className="flex items-end gap-2 h-28">
                {last7.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center justify-end h-full"
                    title={`${d.label}: ${fmtHours(d.minutes)}`}
                  >
                    <div
                      className="w-full max-w-[26px] bg-gradient-to-t from-rose-500 to-pink-400 rounded-t-md transition-all duration-500 hover:opacity-80"
                      style={{
                        height: `${(d.minutes / maxDay) * 100}%`,
                        minHeight: d.minutes > 0 ? "4px" : "0",
                      }}
                    />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow p-5">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Recent Sessions</p>
              <span className="text-xs text-gray-500 dark:text-gray-400">{sessions.length} total</span>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nothing logged yet — your completed sessions will appear here.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 6).map((s) => (
                  <div key={s._id} className="flex justify-between items-center text-sm border-b border-white/30 dark:border-white/10 last:border-0 pb-2 last:pb-0">
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{s.minutes} min</span>
                    <span className="text-gray-500 dark:text-gray-400 text-xs">
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
