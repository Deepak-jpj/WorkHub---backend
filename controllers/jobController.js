const Job = require("../models/Job");
const User = require("../models/User");
const Notification = require("../models/Notification");


// =====================================================
// NOTIFICATION HELPER
// =====================================================

const createNotification = async (
  recipient,
  sender,
  job,
  message,
  type
) => {

  await Notification.create({
    recipient,
    sender,
    job,
    message,
    type
  });

};


// =====================================================
// DISTANCE CALCULATION
// HAVERSINE FORMULA
// Returns distance in KM
// =====================================================

const calculateDistance = (
  lat1,
  lng1,
  lat2,
  lng2
) => {

  const R = 6371;

  const dLat =
    (lat2 - lat1) *
    Math.PI /
    180;

  const dLng =
    (lng2 - lng1) *
    Math.PI /
    180;

  const a =
    Math.sin(dLat / 2) *
    Math.sin(dLat / 2) +

    Math.cos(
      lat1 * Math.PI / 180
    ) *

    Math.cos(
      lat2 * Math.PI / 180
    ) *

    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return R * c;

};


// =====================================================
// NORMALIZE TEXT
// =====================================================

const normalizeText = (value) => {

  return String(value || "")
    .toLowerCase()
    .trim();

};


// =====================================================
// SKILL MATCH CALCULATION
// =====================================================

const calculateSkillMatch = (
  worker,
  category,
  title,
  description
) => {

  const requiredText = [

    category,

    title,

    description

  ]
    .filter(Boolean)
    .map(normalizeText)
    .join(" ");


  const workerSkills =
    Array.isArray(worker.skills)
      ? worker.skills
      : [];


  const normalizedSkills =
    workerSkills.map(
      normalizeText
    );


  if (
    normalizedSkills.length === 0
  ) {

    return 0;

  }


  // ---------------------------------------------------
  // Direct category match
  // ---------------------------------------------------

  if (
    normalizedSkills.some(
      (skill) =>
        requiredText.includes(skill) ||
        skill.includes(
          normalizeText(category)
        )
    )
  ) {

    return 100;

  }


  // ---------------------------------------------------
  // Keyword matching
  // ---------------------------------------------------

  const keywords =
    requiredText
      .split(/[\s,.-]+/)
      .filter(
        (word) =>
          word.length >= 4
      );


  let matched = 0;


  keywords.forEach(
    (keyword) => {

      const found =
        normalizedSkills.some(
          (skill) =>
            skill.includes(keyword) ||
            keyword.includes(skill)
        );

      if (found) {
        matched++;
      }

    }
  );


  if (
    keywords.length === 0
  ) {

    return 0;

  }


  return Math.min(
    100,
    Math.round(
      (matched /
        keywords.length) *
        100
    )
  );

};


// =====================================================
// EXPERIENCE SCORE
// =====================================================

const calculateExperienceScore = (
  experience
) => {

  const years =
    Number(experience) || 0;

  // 10+ years = maximum score

  return Math.min(
    100,
    Math.round(
      (years / 10) * 100
    )
  );

};


// =====================================================
// RATING SCORE
// =====================================================

const calculateRatingScore = (
  rating
) => {

  const value =
    Number(rating) || 0;

  return Math.min(
    100,
    Math.max(
      0,
      (value / 5) * 100
    )
  );

};


// =====================================================
// DISTANCE SCORE
// Closer worker = higher score
// =====================================================

const calculateDistanceScore = (
  distanceKm
) => {

  if (
    distanceKm <= 1
  ) {
    return 100;
  }

  if (
    distanceKm >= 20
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      100 -
      (distanceKm / 20) * 100
    )
  );

};


// =====================================================
// WORKLOAD SCORE
// Fewer active jobs = higher score
// =====================================================

const calculateWorkloadScore = (
  activeJobs
) => {

  const jobs =
    Number(activeJobs) || 0;


  if (jobs === 0) {
    return 100;
  }

  if (jobs === 1) {
    return 90;
  }

  if (jobs === 2) {
    return 75;
  }

  if (jobs === 3) {
    return 55;
  }

  if (jobs === 4) {
    return 35;
  }

  return 15;

};


// =====================================================
// CREATE JOB
// EXISTING MANUAL METHOD - PRESERVED
// =====================================================

exports.createJob = async (
  req,
  res
) => {

  try {

    const {
  title,
  description,
  category,
  payment,
  lat,
  lng,
  scheduledDate,
  scheduledTime
} = req.body;

const workerId = req.body.workerId || req.body.worker;


    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers can create jobs"

      });

    }


    if (!title) {

      return res.status(400).json({

        message:
          "Job title is required"

      });

    }


    if (
      lat == null ||
      lng == null
    ) {

      return res.status(400).json({

        message:
          "Location is required"

      });

    }


    // -------------------------------------------------
    // EXISTING MANUAL WORKER REQUIREMENT
    // -------------------------------------------------

    if (!workerId) {

      return res.status(400).json({

        message:
          "Worker is required"

      });

    }


    const worker =
      await User.findOne({

        _id: workerId,

        role: "worker"

      });


    if (!worker) {

      return res.status(404).json({

        message:
          "Worker not found"

      });

    }


    if (
      !worker.isAvailable
    ) {

      return res.status(400).json({

        message:
          "Worker is currently unavailable"

      });

    }
    


    const job =
      await Job.create({

        title,

        description:
          description || "",

        customer:
          req.user.id,

        worker:
          workerId,

        category:
          category || "other",

        payment:
          Number(payment) || 0,

        location: {

          type: "Point",

          coordinates: [

            Number(lng),

            Number(lat)

          ]

        },

        status:
          "pending",

        // ------------------------------------------------
        // Manual booking
        // ------------------------------------------------

        assignmentMethod:
          "manual",

        aiScore:
          null,

        scheduledDate:
          scheduledDate
            ? new Date(scheduledDate)
            : null,

        scheduledTime:
          scheduledTime || ""

      });


    await createNotification(

      workerId,

      req.user.id,

      job._id,

      "You received a new job request.",

      "job_request"

    );


    const createdJob =
      await Job.findById(
        job._id
      )

        .populate(
          "customer",
          "name email phone"
        )

        .populate(
          "worker",
          "name email phone skills rating experience completedJobs isAvailable"
        );


    res.status(201).json({

      message:
        "Hire request sent successfully",

      job:
        createdJob

    });


  } catch (error) {

    console.error(
      "CREATE JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// GET CUSTOMER JOBS
// =====================================================

exports.getCustomerJobs = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers allowed"

      });

    }


    const jobs =
      await Job.find({

        customer:
          req.user.id

      })

        .populate(

          "worker",

          "name email phone skills rating experience completedJobs isAvailable"

        )

        .sort({

          createdAt:
            -1

        });


    res.json(jobs);


  } catch (error) {

    console.error(
      "CUSTOMER JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// GET WORKER JOBS
// =====================================================

exports.getWorkerJobs = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers allowed"

      });

    }


    const jobs =
      await Job.find({

        worker:
          req.user.id

      })

        .populate(
          "customer",
          "name email phone"
        )

        .populate(
          "worker",
          "name email phone skills rating experience completedJobs isAvailable"
        )

        .sort({

          createdAt:
            -1

        });


    res.json(jobs);


  } catch (error) {

    console.error(
      "WORKER JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// GET PENDING JOBS
// =====================================================

exports.getPendingJobs = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers allowed"

      });

    }


    const jobs =
      await Job.find({

        worker:
          req.user.id,

        status:
          "pending"

      })

        .populate(
          "customer",
          "name email phone"
        )

        .sort({

          createdAt:
            -1

        });


    res.json(jobs);


  } catch (error) {

    console.error(
      "PENDING JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// ACCEPT JOB
// =====================================================

exports.acceptJob = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers can accept jobs"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      !job.worker ||
      job.worker.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This job was not requested from you"

      });

    }


    if (
      job.status !==
      "pending"
    ) {

      return res.status(400).json({

        message:
          "Job is no longer pending"

      });

    }


    const worker =
      await User.findById(
        req.user.id
      );


    if (!worker) {

      return res.status(404).json({

        message:
          "Worker not found"

      });

    }


    if (
      !worker.isAvailable
    ) {

      return res.status(400).json({

        message:
          "You are currently unavailable"

      });

    }


    job.status =
      "accepted";

    job.rejectionReason =
      "";


    await job.save();


    await User.findByIdAndUpdate(

      req.user.id,

      {

        $set: {
          isAvailable:
            false
        }

      }

    );


    await createNotification(

      job.customer,

      req.user.id,

      job._id,

      "Worker accepted your job.",

      "job_accepted"

    );


    const updatedJob =
      await Job.findById(
        job._id
      )

        .populate(
          "worker",
          "name email phone skills rating experience completedJobs isAvailable"
        )

        .populate(
          "customer",
          "name email phone"
        );


    res.json({

      message:
        "Job accepted successfully",

      job:
        updatedJob

    });


  } catch (error) {

    console.error(
      "ACCEPT JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// REJECT JOB
// =====================================================

exports.rejectJob = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers can reject jobs"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      !job.worker ||
      job.worker.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This job was not requested from you"

      });

    }


    if (
      job.status !==
      "pending"
    ) {

      return res.status(400).json({

        message:
          "Only pending jobs can be rejected"

      });

    }


    job.status =
      "rejected";

    job.rejectionReason =
      req.body.reason ||
      "Worker rejected the job";


    await job.save();


    await User.findByIdAndUpdate(

      req.user.id,

      {

        $set: {
          isAvailable:
            true
        }

      }

    );


    await createNotification(

      job.customer,

      req.user.id,

      job._id,

      "Worker rejected your job request.",

      "job_rejected"

    );


    res.json({

      message:
        "Job rejected successfully",

      job

    });


  } catch (error) {

    console.error(
      "REJECT JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// START JOB
// =====================================================

exports.startJob = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers can start jobs"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      !job.worker ||
      job.worker.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This is not your job"

      });

    }


    if (
      job.status !==
      "accepted"
    ) {

      return res.status(400).json({

        message:
          "Only accepted jobs can be started"

      });

    }


    job.status =
      "in-progress";


    await job.save();


    await createNotification(

      job.customer,

      req.user.id,

      job._id,

      "Worker has started your job.",

      "job_started"

    );


    res.json({

      message:
        "Job started successfully",

      job

    });


  } catch (error) {

    console.error(
      "START JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// COMPLETE JOB
// =====================================================

exports.completeJob = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers can complete jobs"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      !job.worker ||
      job.worker.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This is not your job"

      });

    }


    if (
      job.status !==
      "in-progress"
    ) {

      return res.status(400).json({

        message:
          "Start the job before completing it"

      });

    }


    job.status =
      "completed";


    await job.save();


    const worker =
      await User.findByIdAndUpdate(

        req.user.id,

        {

          $inc: {
            completedJobs:
              1
          },

          $set: {
            isAvailable:
              true
          }

        },

        {
          new: true
        }

      );


    await createNotification(

      job.customer,

      req.user.id,

      job._id,

      "Worker completed your job.",

      "job_completed"

    );


    const updatedJob =
      await Job.findById(
        job._id
      )

        .populate(
          "worker",
          "name email phone skills rating experience completedJobs isAvailable"
        )

        .populate(
          "customer",
          "name email phone"
        );


    res.json({

      message:
        "Job completed successfully",

      completedJobs:
        worker.completedJobs,

      job:
        updatedJob

    });


  } catch (error) {

    console.error(
      "COMPLETE JOB ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// REQUEST PAYMENT
// =====================================================

exports.requestPayment = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "worker"
    ) {

      return res.status(403).json({

        message:
          "Only workers can request payment"

      });

    }


    const {
      upiId,
      amount
    } = req.body;


    if (!upiId) {

      return res.status(400).json({

        message:
          "UPI ID is required"

      });

    }


    if (
      !amount ||
      Number(amount) <= 0
    ) {

      return res.status(400).json({

        message:
          "Valid payment amount is required"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      !job.worker ||
      job.worker.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This is not your job"

      });

    }


    if (
      job.status !==
      "completed"
    ) {

      return res.status(400).json({

        message:
          "Complete the job before requesting payment"

      });

    }


    if (
      job.paymentStatus ===
      "paid"
    ) {

      return res.status(400).json({

        message:
          "Payment is already completed"

      });

    }


    job.payment =
      Number(amount);

    job.paymentUpiId =
      upiId.trim();

    job.paymentStatus =
      "requested";

    job.paymentRequestedAt =
      new Date();


    await job.save();


    await createNotification(

      job.customer,

      req.user.id,

      job._id,

      `Worker requested ₹${Number(amount)} payment.`,

      "payment_requested"

    );


    res.json({

      message:
        "Payment request sent to customer",

      job

    });


  } catch (error) {

    console.error(
      "REQUEST PAYMENT ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// CONFIRM PAYMENT
// =====================================================

exports.confirmPayment = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers can confirm payment"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      job.customer.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This is not your job"

      });

    }


    if (
      job.paymentStatus !==
      "requested"
    ) {

      return res.status(400).json({

        message:
          "No payment request found"

      });

    }


    job.paymentStatus =
      "paid";

    job.paymentPaidAt =
      new Date();


    await job.save();


    await createNotification(

      job.worker,

      req.user.id,

      job._id,

      `Customer paid ₹${job.payment}.`,

      "payment_paid"

    );


    res.json({

      message:
        "Payment marked as completed",

      job

    });


  } catch (error) {

    console.error(
      "CONFIRM PAYMENT ERROR:",
      error
    );

    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// SUBMIT REVIEW
// =====================================================

exports.submitReview = async (
  req,
  res
) => {

  try {

    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers can submit reviews"

      });

    }


    const {
      rating,
      review
    } = req.body;


    if (
      !rating ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {

      return res.status(400).json({

        message:
          "Rating must be between 1 and 5"

      });

    }


    const job =
      await Job.findById(
        req.params.id
      );


    if (!job) {

      return res.status(404).json({

        message:
          "Job not found"

      });

    }


    if (
      job.customer.toString() !==
      req.user.id
    ) {

      return res.status(403).json({

        message:
          "This is not your job"

      });

    }


    if (
      job.status !==
      "completed"
    ) {

      return res.status(400).json({

        message:
          "Job must be completed first"

      });

    }


    if (
      job.paymentStatus !==
      "paid"
    ) {

      return res.status(400).json({

        message:
          "Payment must be completed first"

      });

    }


    if (job.rating) {

      return res.status(400).json({

        message:
          "You have already reviewed this job"

      });

    }


    job.rating =
      Number(rating);

    job.review =
      review?.trim() || "";

    job.reviewSubmittedAt =
      new Date();


    await job.save();


    const worker =
      await User.findById(
        job.worker
      );


    if (!worker) {

      return res.status(404).json({

        message:
          "Worker not found"

      });

    }


    const jobs =
      await Job.find({

        worker:
          job.worker,

        rating: {
          $exists: true,
          $ne: null
        }

      }).select("rating");


    const totalRating =
      jobs.reduce(

        (sum, item) =>
          sum + item.rating,

        0

      );


    worker.rating =
      Number(

        (
          totalRating /
          jobs.length
        ).toFixed(1)

      );


    await worker.save();


    await createNotification(

      job.worker,

      req.user.id,

      job._id,

      `You received a ${Number(rating)}-star rating.`,

      "review"

    );


    res.json({

      message:
        "Rating and review submitted successfully",

      rating:
        job.rating,

      review:
        job.review,

      workerRating:
        worker.rating

    });


  } catch (error) {

    console.error(
      "SUBMIT REVIEW ERROR:",
      error
    );


    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// FIND NEAREST WORKERS
// EXISTING METHOD - PRESERVED
// =====================================================

exports.findNearestWorkers = async (
  req,
  res
) => {

  try {

    const {
      lat,
      lng
    } = req.body;


    if (
      lat === undefined ||
      lng === undefined
    ) {

      return res.status(400).json({

        message:
          "Latitude and longitude are required"

      });

    }


    const workers =
      await User.find({

        role:
          "worker",

        isAvailable:
          true,

        location: {

          $near: {

            $geometry: {

              type: "Point",

              coordinates: [

                Number(lng),

                Number(lat)

              ]

            },

            $maxDistance:
              5000

          }

        }

      });


    res.json(
      workers
    );


  } catch (error) {

    console.error(
      "NEAREST WORKERS ERROR:",
      error
    );


    res.status(500).json({

      error:
        error.message

    });

  }

};


// =====================================================
// 🤖 AI WORKER ANALYSIS
// NEW FEATURE
//
// This does NOT create a job.
// It only analyzes and ranks workers.
//
// Customer can look at the result and decide
// whether to send a request manually.
// =====================================================

exports.analyzeWorkersWithAI = async (
  req,
  res
) => {

  try {

    // -------------------------------------------------
    // CUSTOMER ONLY
    // -------------------------------------------------

    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers can use AI worker analysis"

      });

    }


    const {

      title,
      description,
      category,
      lat,
      lng,
      scheduledDate,
      scheduledTime

    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!title) {

      return res.status(400).json({

        message:
          "Job title is required"

      });

    }


    if (
      lat == null ||
      lng == null
    ) {

      return res.status(400).json({

        message:
          "Customer location is required"

      });

    }


    const customerLat =
      Number(lat);

    const customerLng =
      Number(lng);


    if (
      !Number.isFinite(
        customerLat
      ) ||
      !Number.isFinite(
        customerLng
      )
    ) {

      return res.status(400).json({

        message:
          "Invalid customer location"

      });

    }


    // -------------------------------------------------
    // GET AVAILABLE WORKERS
    //
    // IMPORTANT:
    // We do NOT restrict this to 5 km.
    // The AI can analyze all workers with
    // valid locations.
    // -------------------------------------------------

    const workers =
      await User.find({

        role:
          "worker",

        isAvailable:
          true,

        location: {
          $exists:
            true
        }

      }).select(

        "name email phone skills rating experience completedJobs isAvailable location"

      );


    if (
      workers.length === 0
    ) {

      return res.json({

        message:
          "No available workers found.",

        workers: [],

        bestWorker:
          null

      });

    }


    // -------------------------------------------------
    // CALCULATE ACTIVE WORKLOAD
    // -------------------------------------------------

    const rankedWorkers = [];


    for (
      const worker of workers
    ) {

      const coordinates =
        worker.location?.coordinates;


      if (
        !coordinates ||
        coordinates.length !== 2
      ) {

        continue;

      }


      const workerLng =
        Number(
          coordinates[0]
        );

      const workerLat =
        Number(
          coordinates[1]
        );


      if (
        !Number.isFinite(
          workerLat
        ) ||
        !Number.isFinite(
          workerLng
        )
      ) {

        continue;

      }


      // ------------------------------------------------
      // DISTANCE
      // ------------------------------------------------

      const distanceKm =
        calculateDistance(

          customerLat,

          customerLng,

          workerLat,

          workerLng

        );


      // ------------------------------------------------
      // SKILL MATCH
      // ------------------------------------------------

      const skillMatch =
        calculateSkillMatch(

          worker,

          category,

          title,

          description

        );


      // ------------------------------------------------
      // RATING
      // ------------------------------------------------

      const ratingScore =
        calculateRatingScore(

          worker.rating

        );


      // ------------------------------------------------
      // EXPERIENCE
      // ------------------------------------------------

      const experienceScore =
        calculateExperienceScore(

          worker.experience

        );


      // ------------------------------------------------
      // CURRENT WORKLOAD
      // ------------------------------------------------

      const activeJobs =
        await Job.countDocuments({

          worker:
            worker._id,

          status: {
            $in: [
              "pending",
              "accepted",
              "in-progress"
            ]
          }

        });


      const workloadScore =
        calculateWorkloadScore(

          activeJobs

        );


      // ------------------------------------------------
      // AVAILABILITY
      // ------------------------------------------------

      const availabilityScore =
        worker.isAvailable
          ? 100
          : 0;


      // ------------------------------------------------
      // DISTANCE SCORE
      // ------------------------------------------------

      const distanceScore =
        calculateDistanceScore(

          distanceKm

        );


      // ------------------------------------------------
      // AI WEIGHTED SCORE
      //
      // Skill        30%
      // Availability 20%
      // Distance     15%
      // Rating       10%
      // Experience   10%
      // Workload     10%
      // Completed     5%
      // ------------------------------------------------

      const completedJobsScore =
        Math.min(

          100,

          Number(
            worker.completedJobs ||
            0
          ) * 2

        );


      const aiScore =

        skillMatch * 0.30 +

        availabilityScore * 0.20 +

        distanceScore * 0.15 +

        ratingScore * 0.10 +

        experienceScore * 0.10 +

        workloadScore * 0.10 +

        completedJobsScore * 0.05;


      rankedWorkers.push({

        worker: {

          _id:
            worker._id,

          name:
            worker.name,

          email:
            worker.email,

          phone:
            worker.phone,

          skills:
            worker.skills,

          rating:
            worker.rating,

          experience:
            worker.experience,

          completedJobs:
            worker.completedJobs,

          isAvailable:
            worker.isAvailable,

          location:
            worker.location

        },

        aiScore:
          Number(
            aiScore.toFixed(2)
          ),

        distanceKm:
          Number(
            distanceKm.toFixed(2)
          ),

        activeJobs,

        scoreBreakdown: {

          skillMatch:
            Number(
              skillMatch.toFixed(2)
            ),

          availability:
            Number(
              availabilityScore.toFixed(2)
            ),

          distance:
            Number(
              distanceScore.toFixed(2)
            ),

          rating:
            Number(
              ratingScore.toFixed(2)
            ),

          experience:
            Number(
              experienceScore.toFixed(2)
            ),

          workload:
            Number(
              workloadScore.toFixed(2)
            ),

          completedJobs:
            Number(
              completedJobsScore.toFixed(2)
            )

        }

      });

    }


    // -------------------------------------------------
    // SORT BEST → WORST
    // -------------------------------------------------

    rankedWorkers.sort(

      (a, b) =>
        b.aiScore -
        a.aiScore

    );


    // -------------------------------------------------
    // BEST WORKER
    // -------------------------------------------------

    const bestWorker =
      rankedWorkers.length > 0
        ? rankedWorkers[0]
        : null;


    res.json({

      success:
        true,

      message:
        "AI worker analysis completed.",

      requestedJob: {

        title,

        description:
          description || "",

        category:
          category || "other",

        scheduledDate:
          scheduledDate || null,

        scheduledTime:
          scheduledTime || ""

      },

      totalWorkersAnalyzed:
        rankedWorkers.length,

      bestWorker,

      workers:
        rankedWorkers

    });


  } catch (error) {

    console.error(
      "AI WORKER ANALYSIS ERROR:",
      error
    );


    res.status(500).json({

      message:
        "AI worker analysis failed.",

      error:
        error.message

    });

  }

};


// =====================================================
// 🤖 AI AUTOMATIC WORKER ASSIGNMENT
//
// This is the fully automatic option.
//
// Customer gives job requirements.
// AI analyzes workers.
// Best worker is automatically selected.
// Job request is automatically sent.
// Existing worker accept/reject system remains.
// =====================================================

exports.autoAssignWorker = async (
  req,
  res
) => {

  try {

    // -------------------------------------------------
    // CUSTOMER ONLY
    // -------------------------------------------------

    if (
      req.user.role !==
      "customer"
    ) {

      return res.status(403).json({

        message:
          "Only customers can use AI automatic assignment"

      });

    }


    const {

      title,
      description,
      category,
      payment,
      lat,
      lng,
      scheduledDate,
      scheduledTime

    } = req.body;


    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------

    if (!title) {

      return res.status(400).json({

        message:
          "Job title is required"

      });

    }


    if (
      lat == null ||
      lng == null
    ) {

      return res.status(400).json({

        message:
          "Customer location is required"

      });

    }


    const customerLat =
      Number(lat);

    const customerLng =
      Number(lng);


    if (
      !Number.isFinite(
        customerLat
      ) ||
      !Number.isFinite(
        customerLng
      )
    ) {

      return res.status(400).json({

        message:
          "Invalid customer location"

      });

    }


    // -------------------------------------------------
    // GET ALL AVAILABLE WORKERS
    // -------------------------------------------------

    const workers =
      await User.find({

        role:
          "worker",

        isAvailable:
          true,

        location: {
          $exists:
            true
        }

      }).select(

        "name email phone skills rating experience completedJobs isAvailable location"

      );


    if (
      workers.length === 0
    ) {

      return res.status(404).json({

        message:
          "No available workers are currently suitable for automatic assignment."

      });

    }


    const rankedWorkers = [];


    // =================================================
    // ANALYZE EACH WORKER
    // =================================================

    for (
      const worker of workers
    ) {

      const coordinates =
        worker.location?.coordinates;


      if (
        !coordinates ||
        coordinates.length !== 2
      ) {

        continue;

      }


      const workerLng =
        Number(
          coordinates[0]
        );

      const workerLat =
        Number(
          coordinates[1]
        );


      if (
        !Number.isFinite(
          workerLat
        ) ||
        !Number.isFinite(
          workerLng
        )
      ) {

        continue;

      }


      // ------------------------------------------------
      // SKILL
      // ------------------------------------------------

      const skillMatch =
        calculateSkillMatch(

          worker,

          category,

          title,

          description

        );


      // ------------------------------------------------
      // IMPORTANT:
      // Automatic assignment should not choose
      // a worker with zero skill match.
      // ------------------------------------------------

      if (
        skillMatch <= 0
      ) {

        continue;

      }


      // ------------------------------------------------
      // DISTANCE
      // ------------------------------------------------

      const distanceKm =
        calculateDistance(

          customerLat,

          customerLng,

          workerLat,

          workerLng

        );


      const distanceScore =
        calculateDistanceScore(

          distanceKm

        );


      // ------------------------------------------------
      // RATING
      // ------------------------------------------------

      const ratingScore =
        calculateRatingScore(

          worker.rating

        );


      // ------------------------------------------------
      // EXPERIENCE
      // ------------------------------------------------

      const experienceScore =
        calculateExperienceScore(

          worker.experience

        );


      // ------------------------------------------------
      // WORKLOAD
      // ------------------------------------------------

      const activeJobs =
        await Job.countDocuments({

          worker:
            worker._id,

          status: {
            $in: [
              "pending",
              "accepted",
              "in-progress"
            ]
          }

        });


      const workloadScore =
        calculateWorkloadScore(

          activeJobs

        );


      // ------------------------------------------------
      // AVAILABILITY
      // ------------------------------------------------

      const availabilityScore =
        worker.isAvailable
          ? 100
          : 0;


      // ------------------------------------------------
      // COMPLETED JOBS
      // ------------------------------------------------

      const completedJobsScore =
        Math.min(

          100,

          Number(
            worker.completedJobs ||
            0
          ) * 2

        );


      // ------------------------------------------------
      // FINAL AI SCORE
      // ------------------------------------------------

      const aiScore =

        skillMatch * 0.30 +

        availabilityScore * 0.20 +

        distanceScore * 0.15 +

        ratingScore * 0.10 +

        experienceScore * 0.10 +

        workloadScore * 0.10 +

        completedJobsScore * 0.05;


      rankedWorkers.push({

        worker,

        aiScore:
          Number(
            aiScore.toFixed(2)
          ),

        distanceKm:
          Number(
            distanceKm.toFixed(2)
          ),

        activeJobs,

        scoreBreakdown: {

          skillMatch,

          availability:
            availabilityScore,

          distance:
            distanceScore,

          rating:
            Number(
              ratingScore.toFixed(2)
            ),

          experience:
            experienceScore,

          workload:
            workloadScore,

          completedJobs:
            completedJobsScore

        }

      });

    }


    // -------------------------------------------------
    // SORT
    // -------------------------------------------------

    rankedWorkers.sort(

      (a, b) =>
        b.aiScore -
        a.aiScore

    );


    // -------------------------------------------------
    // NO SKILL-MATCHED WORKER
    // -------------------------------------------------

    if (
      rankedWorkers.length === 0
    ) {

      return res.status(404).json({

        message:
          "No available worker with a matching skill was found."

      });

    }


    // -------------------------------------------------
    // BEST WORKER
    // -------------------------------------------------

    const selected =
      rankedWorkers[0];


    const worker =
      selected.worker;


    // =================================================
    // CREATE JOB
    // =================================================

    const job =
      await Job.create({

        title,

        description:
          description || "",

        customer:
          req.user.id,

        worker:
          worker._id,

        category:
          category || "other",

        payment:
          Number(payment) || 0,

        location: {

          type:
            "Point",

          coordinates: [

            customerLng,

            customerLat

          ]

        },

        status:
          "pending",


        // ------------------------------------------------
        // AI INFORMATION
        // ------------------------------------------------

        assignmentMethod:
          "ai_auto",

        aiScore:
          selected.aiScore,

        aiScoreBreakdown: {

          skillMatch:
            selected.scoreBreakdown.skillMatch,

          availability:
            selected.scoreBreakdown.availability,

          distance:
            selected.scoreBreakdown.distance,

          rating:
            selected.scoreBreakdown.rating,

          experience:
            selected.scoreBreakdown.experience,

          workload:
            selected.scoreBreakdown.workload,

          completedJobs:
            selected.scoreBreakdown.completedJobs

        },

        aiAssignedAt:
          new Date(),


        // ------------------------------------------------
        // SCHEDULING
        // ------------------------------------------------

        scheduledDate:
          scheduledDate
            ? new Date(scheduledDate)
            : null,

        scheduledTime:
          scheduledTime || ""

      });


    // =================================================
    // NOTIFY WORKER
    // =================================================

    await createNotification(

      worker._id,

      req.user.id,

      job._id,

      `🤖 AI automatically assigned you a new ${category || "service"} job.`,

      "job_request"

    );


    // =================================================
    // GET COMPLETE JOB
    // =================================================

    const createdJob =
      await Job.findById(
        job._id
      )

        .populate(
          "customer",
          "name email phone"
        )

        .populate(
          "worker",
          "name email phone skills rating experience completedJobs isAvailable"
        );


    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({

      success:
        true,

      message:
        "AI automatically assigned the best available worker.",

      assignmentMethod:
        "ai_auto",

      ai: {

        selectedWorker:
          worker.name,

        aiScore:
          selected.aiScore,

        distanceKm:
          selected.distanceKm,

        scoreBreakdown:
          selected.scoreBreakdown

      },

      job:
        createdJob

    });


  } catch (error) {

    console.error(
      "AI AUTO ASSIGN ERROR:",
      error
    );


    res.status(500).json({

      message:
        "AI automatic worker assignment failed.",

      error:
        error.message

    });

  }

};