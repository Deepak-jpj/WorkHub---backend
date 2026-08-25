const express = require("express");

const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");

const {
  chatbot
} = require("../controllers/chatbotController");


// =====================================================
// CHATBOT
// =====================================================

router.post(
  "/",
  verifyToken,
  chatbot
);


module.exports = router;