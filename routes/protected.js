const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const admin = require("../utils/firebase");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Helper to detect Firebase tokens
const isFirebaseToken = (token) => {
  try {
    const decoded = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return decoded.firebase !== undefined;
  } catch {
    return false;
  }
};

router.get("/", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Authorization header missing or malformed" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (isFirebaseToken(token)) {
      // Firebase token
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ email: decodedFirebase.email });

      return res.json({
        message: `Welcome back, ${user?.name || "Google user"}!`,
        user,
        authProvider: "Google",
      });
    } else {
      // Standard JWT
      const decodedJWT = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decodedJWT.id);

      return res.json({
        message: `Welcome back, ${user?.name || "user"}!`,
        user,
        authProvider: "Email/Password",
      });
    }
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
