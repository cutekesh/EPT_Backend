// backend/routes/auth.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const admin = require("../utils/firebase"); // adjust path as needed
// Secret key for JWT
const JWT_SECRET = "your_secret_key"; // move to env in production
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Register
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.status(201).json({ user: { id: user._id, name, email }, token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ user: { id: user._id, name: user.name, email }, token });
  } catch (err) {
    console.error("Login error:", err); // ← log it!
    res.status(500).json({ message: "Server error" });
  }
});

// Google Authentication Route
router.post("/google-auth", async (req, res) => {
  const { token } = req.body;

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const { uid, email, name } = decodedToken;

    // Check if user exists
    let user = await User.findOne({ email });

    // If not, create new user (optional password fallback using UID)
    if (!user) {
      user = await User.create({
        name,
        email,
        password: uid, // or a generated string (just not used manually)
        googleId: uid,
      });
    }

    // Generate your own JWT for session handling
    const jwtToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "your_secret_key",
      {
        expiresIn: "1h",
      }
    );

    res.json({ token: jwtToken, user: { id: user._id, name, email } });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid Google token", error });
  }
});

// ============ FORGOT PASSWORD LOGIC =============
router.post("/forgot-password", async (req, res) => {
  console.log("📩 Forgot-password endpoint hit with", req.body.email);
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  //  Generate random token (32 bytes → hex)
  const resetToken = crypto.randomBytes(32).toString("hex");
  const tokenExpire = Date.now() + 15 * 60 * 1000; // 15 min

  user.resetToken = resetToken;
  user.resetTokenExpire = tokenExpire;
  await user.save();

  const resetURL = `${process.env.BASE_URL}/reset-password/${resetToken}`;

  const html = `
    <p>Hello ${user.name || "there"},</p>
    <p>Click the link below to reset your EPT account password (valid 15 min):</p>
    <a href="${resetURL}">${resetURL}</a>
    <p>If you didn’t request this, just ignore this e-mail.</p>
  `;

  try {
    await sendEmail({ to: email, subject: "Password reset", html });
    res.json({ message: "Reset e-mail sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "E-mail failed to send" });
  }
});

// ============== RESET PASSWORD LOGIC ============

router.post("/reset-password/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetToken: token,
    resetTokenExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired token" });

  user.password = password; // pre-save hook re-hashes
  user.resetToken = undefined;
  user.resetTokenExpire = undefined;
  await user.save();

  res.json({ message: "Password updated. You can log in now." });
});

module.exports = router;

// https://ept-rebranding-6qd1.vercel.app//reset-password/e11036f4c0a936af9ec6a7e696b99068066427599cc194ab43f81e97ab84ae13
