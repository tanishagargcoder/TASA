const express = require("express");
const FocusSession = require("../models/FocusSession");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// LOG A COMPLETED FOCUS SESSION
router.post("/", authMiddleware, async (req, res) => {
  try {
    const minutes = Number(req.body.minutes);

    if (!minutes || minutes <= 0 || minutes > 240) {
      return res.status(400).json({ message: "Invalid session length" });
    }

    const session = new FocusSession({
      minutes,
      userId: req.user.id
    });

    await session.save();
    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET MY FOCUS SESSIONS (recent)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const sessions = await FocusSession.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(500);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
