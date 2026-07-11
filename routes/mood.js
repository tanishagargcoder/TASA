const express = require("express");
const Mood = require("../models/Mood");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// SET TODAY'S MOOD (upsert — one per day)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { mood } = req.body;

    if (!["happy", "normal", "sad", "stressed"].includes(mood)) {
      return res.status(400).json({ message: "Invalid mood" });
    }

    const entry = await Mood.findOneAndUpdate(
      { userId: req.user.id, day: todayKey() },
      { mood },
      { new: true, upsert: true }
    );

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET MY MOOD HISTORY (last ~4 months)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const moods = await Mood.find({ userId: req.user.id })
      .sort({ day: -1 })
      .limit(120);
    res.json(moods);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
