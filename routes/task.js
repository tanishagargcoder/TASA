const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ADD TASK (PROTECTED)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const task = new Task({
      title: req.body.title,
      description: req.body.description,
      userId: req.user.id
    });

    await task.save();
    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET MY TASKS (PROTECTED)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ TOGGLE TASK STATUS
router.put("/toggle/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    task.completed = !task.completed;  // reverse
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// 🗑 DELETE TASK (PROTECTED)  ✅ NEW
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✏ UPDATE TASK (PROTECTED)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      { title: req.body.title },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
