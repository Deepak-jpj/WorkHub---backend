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

app.use(express.json());

// =====================================================
// ROUTES
// =====================================================

app.use("/api/auth", authRoutes);

app.use("/api/job", jobRoutes);

app.use("/api/chatbot", chatbotRoutes);

app.use("/api/notifications", notificationRoutes);

// =====================================================
// TEST / HEALTH ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.status(200).send("Worker Platform API Running");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    service: "WorkHub Backend"
  });
});

// =====================================================
// MONGODB CONNECTION + SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Database Error:", err);
    process.exit(1);
  }
}

startServer();

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down...");

  await mongoose.connection.close();

  process.exit(0);
});