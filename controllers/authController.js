const otpGenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const User = require("../models/User");

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otp = otpGenerator.generate(6, {
      digits: true,
      alphabets: false,
      upperCase: false,
      specialChars: false,
    });

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;

    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "tanishagarg1208@gmail.com",
        pass: "mcwn dlvu dyzk okrc",
      },
    });

    await transporter.sendMail({
      to: email,
      subject: "OTP for password reset",
      text: `Your OTP is ${otp}`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
