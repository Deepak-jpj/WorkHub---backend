const express = require("express");
const router = express.Router();

const {
  register,
  verifyRegistrationOTP,
  resendRegistrationOTP,
  updateAvailability,
  updateLocation,
  loginUser,
  getWorkers,
  getPublicWorkers,
  getCustomers,
  deleteUser,
} = require("../controllers/authController");

const { verifyToken } = require("../middleware/authMiddleware");

// =========================================
// REGISTRATION AND EMAIL VERIFICATION
// =========================================

// Register customer or worker and send OTP
router.post("/register", register);

// Verify OTP and create the account
router.post("/verify-registration", verifyRegistrationOTP);

// Resend OTP to the registered email
router.post("/resend-registration-otp", resendRegistrationOTP);

// =========================================
// LOGIN
// =========================================

router.post("/login", loginUser);

// =========================================
// WORKER AVAILABILITY
// =========================================

router.put("/availability", verifyToken, updateAvailability);

// =========================================
// WORKER LOCATION
// =========================================

router.put("/location", verifyToken, updateLocation);

// =========================================
// GET ALL WORKERS
// =========================================

router.get("/workers", verifyToken, getWorkers);

// =========================================
// GET PUBLIC WORKERS
// =========================================

router.get("/public-workers", getPublicWorkers);

// =========================================
// GET ALL CUSTOMERS
// =========================================

router.get("/customers", verifyToken, getCustomers);

// =========================================
// ADMIN REMOVE USER
// =========================================

router.delete("/users/:id", verifyToken, deleteUser);

module.exports = router;