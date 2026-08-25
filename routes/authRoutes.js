const express = require("express");

const router = express.Router();

const {
  register,
  updateAvailability,
  updateLocation,
  loginUser,
  sendOtp,
  verifyOtp,
  getWorkers,
  getPublicWorkers,
  getCustomers,
  deleteUser
} = require("../controllers/authController");

const {
  verifyToken
} = require("../middleware/authMiddleware");

// =====================================================
// SEND OTP
// =====================================================

router.post(
  "/send-otp",
  sendOtp
);

// =====================================================
// VERIFY OTP
// =====================================================

router.post(
  "/verify-otp",
  verifyOtp
);

// =====================================================
// REGISTER
// =====================================================

router.post(
  "/register",
  register
);

// =====================================================
// LOGIN
// =====================================================

router.post(
  "/login",
  loginUser
);

// =====================================================
// WORKER AVAILABILITY
// =====================================================

router.put(
  "/availability",
  verifyToken,
  updateAvailability
);

// =====================================================
// WORKER LOCATION
// Update current/exact location
// =====================================================

router.put(
  "/location",
  verifyToken,
  updateLocation
);

// =====================================================
// GET ALL WORKERS
// CUSTOMER DASHBOARD
// =====================================================

router.get(
  "/workers",
  verifyToken,
  getWorkers
);

// =====================================================
// GET PUBLIC WORKERS
// HOMEPAGE MAP
// =====================================================

router.get(
  "/public-workers",
  getPublicWorkers
);

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

router.get(
  "/customers",
  verifyToken,
  getCustomers
);

// =====================================================
// ADMIN REMOVE USER
// =====================================================

router.delete(
  "/users/:id",
  verifyToken,
  deleteUser
);

module.exports = router;