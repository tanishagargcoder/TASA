const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
const noteRoutes = require("./routes/note");
const expenseRoutes = require("./routes/expense");
const focusRoutes = require("./routes/focus");
const moodRoutes = require("./routes/mood");

const app = express();

// Render/Vercel sit behind a proxy — needed so rate limiting sees real client IPs
app.set("trust proxy", 1);

app.use(express.json());
app.use(cors());

const MONGO_URI = process.env.MONGO_URI || process.env.MONGO_URL;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI (or MONGO_URL) environment variable is not set");
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Brute-force protection on auth endpoints (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again in 15 minutes" }
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/focus", focusRoutes);
app.use("/api/mood", moodRoutes);

app.get("/", (req, res) => {
  res.send("TASA API running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});