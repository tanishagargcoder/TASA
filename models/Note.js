const mongoose = require("mongoose");

const NoteSchema = new mongoose.Schema({

  text: {
    type: String,
    required: true
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  pinned: {
    type: Boolean,
    default: false
  },

  color: {
    type: String,
    enum: ["yellow", "rose", "blue", "green", "purple"],
    default: "yellow"
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model("Note", NoteSchema);