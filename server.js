const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");
const noteRoutes = require("./routes/note");
const expenseRoutes = require("./routes/expense");

const app = express();

app.use(express.json());
app.use(cors());


// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));


// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/expenses", expenseRoutes);


// Serve React frontend
app.use(express.static(path.join(__dirname, "tasa-frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "tasa-frontend/build/index.html"));
});


// Default route
app.get("/", (req, res) => {
  res.send("TASA API running...");
});


// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});