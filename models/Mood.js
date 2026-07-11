const mongoose = require("mongoose");

const moodSchema = new mongoose.Schema(
  {
    // one entry per user per day, e.g. "2026-07-11"
    day: { type: String, required: true },
    mood: {
      type: String,
      enum: ["happy", "normal", "sad", "stressed"],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

moodSchema.index({ userId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model("Mood", moodSchema);
