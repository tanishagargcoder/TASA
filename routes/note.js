const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const authMiddleware = require("../middleware/authMiddleware");


// GET my notes (PROTECTED)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id }).sort({ pinned: -1, createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ADD note (PROTECTED)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const note = new Note({
      text: req.body.text,
      userId: req.user.id
    });

    const savedNote = await note.save();
    res.status(201).json(savedNote);
  } catch (err) {
    console.error("NOTE SAVE ERROR:", err);
    res.status(500).json({ message: "Error saving note" });
  }
});


// DELETE note (only own note)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed" });
  }
});


// UPDATE note (only own note)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    ["text", "pinned"].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updatedNote = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!updatedNote) {
      return res.status(404).json({ message: "Note not found" });
    }

    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});


module.exports = router;
