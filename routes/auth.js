const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");
const sendEmail = require("../utils/sendEmail");
const router = express.Router();


// ================= REGISTER USER =================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 🔥 CHECK IF USER EXISTS
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= LOGIN USER =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= FORGOT PASSWORD – SEND OTP =================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    // 🔥 ACTUAL EMAIL SEND
    await sendEmail(
      email,
      "TASA Password Reset OTP",
      `Your OTP for password reset is: ${otp}`
    );

    console.log("Email sent successfully");

    res.json({ message: "OTP sent to your email ✨" });

  } catch (error) {
    console.log("EMAIL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});


// ================= VERIFY OTP =================
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    res.json({ message: "OTP verified successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= RESET PASSWORD (NOW OTP REQUIRED) =================
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    // 🔥 VERIFY OTP AGAIN FOR SECURITY
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password = hashed;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    res.json({ message: "Password updated successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= CHANGE PASSWORD (LOGGED IN USER) =================
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;

    await user.save();

    res.json({ message: "Password changed successfully" });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= GET LOGGED IN USER =================
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= UPDATE PROFILE (name / monthly budget) =================
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined && req.body.name.trim()) {
      updates.name = req.body.name.trim();
    }
    if (req.body.monthlyBudget !== undefined) {
      updates.monthlyBudget = Math.max(0, Number(req.body.monthlyBudget) || 0);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
      .select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ================= DELETE ACCOUNT (AND ALL USER DATA) =================
router.delete("/me", authMiddleware, async (req, res) => {
  try {
    const Task = require("../models/Task");
    const Note = require("../models/Note");
    const Expense = require("../models/Expense");
    const FocusSession = require("../models/FocusSession");
    const Mood = require("../models/Mood");

    const userId = req.user.id;

    await Promise.all([
      Task.deleteMany({ userId }),
      Note.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      Mood.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;