// Load core libraries ────────────────────────────────────────────────────────
const express = require("express"); // Web-framework for routing & middleware
const mongoose = require("mongoose"); // MongoDB ORM / ODM
const cors = require("cors"); // Enables Cross-Origin Resource Sharing
require("dotenv").config(); // Loads variables from .env into process.env

// Initialize Firebase Admin credentials (side-effect import)
require("./utils/firebase"); // Verifies env vars & makes admin available

// ─────────────────────────────────────────────────────────────────────────────

// Fail fast if the Mongo connection string is missing
if (!process.env.MONGO_URI) {
  console.error("❌  MONGO_URI missing in .env");
  process.exit(1); // Stop the server—can’t run without DB
}

// Create Express app instance
const app = express();

// Added this to parse incoming JSON
app.use(express.json());

app.use(
  cors({
    origin: ["https://ept-rebranding-6qd1.vercel.app", "http://localhost:5173"], // Adjust to your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─────────────────────────────────────────────────────────────────────────────
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI) // Uses env var MONGO_URI
  .then(() => {
    console.log("✅ MongoDB connected");
    console.log("Connected DB name:", mongoose.connection.name); // Handy info
  })
  .catch((err) => console.error("❌ MongoDB error:", err));

// ─────────────────────────────────────────────────────────────────────────────
// Route mounts
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes); // Signup / login / reset
app.use("/api/protected", require("./routes/protected")); // Routes requiring auth

// 404 handler (runs if no route matches)
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Generic error handler (catches thrown errors or next(err))
app.use((err, req, res, _next) => {
  console.error(err); // Log full stack trace
  res.status(500).json({ message: "Server error" });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pick port from env (Render/Railway) or default to 5000 for local dev
const PORT = process.env.PORT || 4000;

// Start HTTP server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
