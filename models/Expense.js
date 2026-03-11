const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: ["Food", "Travel", "Shopping", "Bills", "Other"],
      required: true
    },
    date: { type: Date, default: Date.now },
    note: { type: String },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);