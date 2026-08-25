const express = require("express");

const router = express.Router();

const {
  verifyToken
} = require("../middleware/authMiddleware");

const {

  // Existing features
  createJob,
  getCustomerJobs,
  getWorkerJobs,
  getPendingJobs,
  acceptJob,
  rejectJob,
  startJob,
  completeJob,
  requestPayment,
  confirmPayment,
  submitReview,
  findNearestWorkers,

  // New AI features
  analyzeWorkersWithAI,
  autoAssignWorker

} = require("../controllers/jobController");


// =====================================================
// EXISTING JOB ROUTES
// =====================================================

router.post(
  "/create",
  verifyToken,
  createJob
);

router.get(
  "/my-jobs",
  verifyToken,
  getCustomerJobs
);

router.get(
  "/worker-jobs",
  verifyToken,
  getWorkerJobs
);

router.get(
  "/pending",
  verifyToken,
  getPendingJobs
);

router.put(
  "/accept/:id",
  verifyToken,
  acceptJob
);

router.put(
  "/reject/:id",
  verifyToken,
  rejectJob
);

router.put(
  "/start/:id",
  verifyToken,
  startJob
);

router.put(
  "/complete/:id",
  verifyToken,
  completeJob
);

router.put(
  "/request-payment/:id",
  verifyToken,
  requestPayment
);

router.put(
  "/confirm-payment/:id",
  verifyToken,
  confirmPayment
);

router.put(
  "/review/:id",
  verifyToken,
  submitReview
);

router.post(
  "/nearest-workers",
  verifyToken,
  findNearestWorkers
);


// =====================================================
// 🤖 NEW AI ROUTES
// =====================================================

// Analyze and rank workers
// Does NOT create a job
router.post(
  "/ai-analyze-workers",
  verifyToken,
  analyzeWorkersWithAI
);


// Automatically select and assign the best worker
router.post(
  "/ai-auto-assign",
  verifyToken,
  autoAssignWorker
);


module.exports = router;