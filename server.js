require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const chatbotRoutes = require("./routes/chatbotRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json({ limit: "1mb" }));

// =====================================================
// ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/job", jobRoutes);

app.use("/api/chatbot", chatbotRoutes);

app.use("/api/notifications", notificationRoutes);

// =====================================================
// TEST / HEALTH ROUTES
// =====================================================

app.get("/", (req, res) => {
  res.status(200).send("WorkHub Backend API Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    service: "WorkHub Backend"
  });
});

// =====================================================
// ERROR HANDLER FOR INVALID JSON
// =====================================================

app.use((err, req, res, next) => {
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON request body."
    });
  }

  next(err);
});

// =====================================================
// MONGODB CONNECTION + SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from the .env file.");
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing from the .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`WorkHub Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Backend Startup Error:", err.message);
    process.exit(1);
  }
}

startServer();

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");

  try {
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("Error closing MongoDB connection:", error);
    process.exit(1);
  }
});