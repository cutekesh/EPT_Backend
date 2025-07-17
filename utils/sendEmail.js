// still valid
const crypto = require("crypto"); // built-in
const nodemailer = require("nodemailer");
require("dotenv").config();
// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: true, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Accept self-signed certs (Only if needed). but (not recommended for production based to avoid security issues)
  },
});

module.exports = async function sendEmail({ to, subject, html }) {
  try {
    console.log("Attempting to send email to:", to);

    await transporter.sendMail({
      from: `"EPT-REBRANDING" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("✅ Email sent to", to);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    throw err; // <-- propagate error to route handler
  }
};

// const sendEmail = require("./sendEmail");

// sendEmail({
//   to: "cutekesh.21@gmail.com",
//   subject: "Test Email from Node App",
//   html: "<p>This is a test email sent via Gmail SMTP.</p>",
// });
