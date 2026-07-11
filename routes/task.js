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
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      category: req.body.category,
      status: req.body.status,
      userId: req.user.id
    });

    if (task.status === "done") task.completed = true;

    await task.save();
    res.status(201).json(task);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// GET MY TASKS (PROTECTED)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TOGGLE TASK STATUS (only own task)
router.put("/toggle/:id", authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    task.completed = !task.completed;
    task.status = task.completed ? "done" : "todo";
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE TASK (only own task)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE TASK (only own task)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    ["title", "description", "priority", "dueDate", "completed", "category", "status"].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Keep status and completed in sync whichever one was sent
    if (updates.status !== undefined) {
      updates.completed = updates.status === "done";
    } else if (updates.completed !== undefined) {
      updates.status = updates.completed ? "done" : "todo";
    }

    // Track completion time for activity analytics
    if (updates.completed === true) {
      updates.completedAt = new Date();
    } else if (updates.completed === false) {
      updates.completedAt = null;
    }

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
