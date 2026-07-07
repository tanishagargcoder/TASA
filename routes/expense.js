const express = require("express");
const Expense = require("../models/Expense");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ADD EXPENSE
router.post("/", authMiddleware, async (req, res) => {
  try {
    const expense = new Expense({
      amount: req.body.amount,
      category: req.body.category,
      note: req.body.note,
      date: req.body.date,
      userId: req.user.id
    });

    await expense.save();
    res.status(201).json(expense);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET MY EXPENSES
router.get("/", authMiddleware, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE EXPENSE (only own expense)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deleted = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE EXPENSE (only own expense)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    ["amount", "category", "note", "date"].forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
