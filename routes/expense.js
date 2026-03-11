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
    const expenses = await Expense.find({ userId: req.user.id });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
