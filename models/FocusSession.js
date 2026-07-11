const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    minutes: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);
