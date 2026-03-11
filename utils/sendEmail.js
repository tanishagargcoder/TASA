const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL,
      to,
      subject,
      text
    });

    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email error:", error);
  }
};

module.exports = sendEmail;