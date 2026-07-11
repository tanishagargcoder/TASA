const express = require("express");
const Task = require("../models/Task");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Next due date for a recurring task
function nextDueDate(base, recurrence) {
  const d = base ? new Date(base) : null;
  if (!d) return null;
  if (recurrence === "daily") d.setDate(d.getDate() + 1);
  if (recurrence === "weekly") d.setDate(d.getDate() + 7);
  if (recurrence === "monthly") d.setMonth(d.getMonth() + 1);
  return d;
}

// When a recurring task is completed, create its next occurrence
async function spawnNextOccurrence(task) {
  if (!task.recurrence || task.recurrence === "none") return;

  await new Task({
    title: task.title,
    description: task.description,
    priority: task.priority,
    category: task.category,
    recurrence: task.recurrence,
    dueDate: nextDueDate(task.dueDate, task.recurrence),
    status: "todo",
    completed: false,
    userId: task.userId
  }).save();
}


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
      recurrence: req.body.recurrence,
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

    if (task.completed) await spawnNextOccurrence(task);

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
    const task = await Task.findOne({ _id: req.params.id, userId: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const wasCompleted = task.completed;

    const updates = {};
    ["title", "description", "priority", "dueDate", "completed", "category", "status", "recurrence"].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Keep status and completed in sync whichever one was sent
    if (updates.status !== undefined) {
      updates.completed = updates.status === "done";
    } else if (updates.completed !== undefined) {
      updates.status = updates.completed ? "done" : "todo";
    }

    Object.assign(task, updates);

    // Track completion time only on actual transition
    if (!wasCompleted && task.completed) {
      task.completedAt = new Date();
    } else if (wasCompleted && !task.completed) {
      task.completedAt = null;
    }

    await task.save();

    if (!wasCompleted && task.completed) {
      await spawnNextOccurrence(task);
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
