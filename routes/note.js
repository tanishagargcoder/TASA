const express = require("express");
const router = express.Router();
const Note = require("../models/Note");


// GET all notes
router.get("/", async (req, res) => {
  try {

    const notes = await Note.find().sort({ createdAt: -1 });

    res.json(notes);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ADD note
router.post("/", async (req, res) => {

  try {

    const note = new Note({
      text: req.body.text
    });

    const savedNote = await note.save();

    res.json(savedNote);

  } catch (err) {

    console.error("NOTE SAVE ERROR:", err);
    res.status(500).json({ message: "Error saving note" });

  }

});


// DELETE note
router.delete("/:id", async (req, res) => {

  try {

    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: "Note deleted" });

  } catch (err) {

    res.status(500).json({ message: "Delete failed" });

  }

});


// UPDATE note
router.put("/:id", async (req, res) => {

  try {

    const updatedNote = await Note.findByIdAndUpdate(
      req.params.id,
      { text: req.body.text },
      { new: true }
    );

    res.json(updatedNote);

  } catch (err) {

    res.status(500).json({ message: "Update failed" });

  }

});


module.exports = router;