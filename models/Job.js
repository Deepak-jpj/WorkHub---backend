const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {

    // =====================================================
    // CUSTOMER
    // =====================================================

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },


    // =====================================================
    // WORKER
    // Existing manual worker selection is preserved
    // =====================================================

    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },


    // =====================================================
    // JOB INFORMATION
    // =====================================================

    title: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    category: {
      type: String,
      enum: [
        "construction",
        "electrician",
        "plumber",
        "cleaning",
        "other"
      ],
      default: "other"
    },


    // =====================================================
    // SCHEDULING
    // NEW
    // =====================================================

    scheduledDate: {
      type: Date,
      default: null
    },

    scheduledTime: {
      type: String,
      default: ""
    },


    // =====================================================
    // PAYMENT
    // =====================================================

    payment: {
      type: Number,
      required: true,
      default: 0
    },

    paymentStatus: {
      type: String,
      enum: [
        "not_requested",
        "requested",
        "paid"
      ],
      default: "not_requested"
    },

    paymentUpiId: {
      type: String,
      default: ""
    },

    paymentRequestedAt: {
      type: Date,
      default: null
    },

    paymentPaidAt: {
      type: Date,
      default: null
    },


    // =====================================================
    // RATING & REVIEW
    // =====================================================

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },

    review: {
      type: String,
      default: ""
    },

    reviewSubmittedAt: {
      type: Date,
      default: null
    },


    // =====================================================
    // LOCATION
    // =====================================================

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },

      coordinates: {
        type: [Number],
        required: true
      }
    },


    // =====================================================
    // JOB STATUS
    // =====================================================

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "in-progress",
        "completed",
        "rejected"
      ],
      default: "pending"
    },

    rejectionReason: {
      type: String,
      default: ""
    },


    // =====================================================
    // AI SCHEDULING
    // NEW
    // =====================================================

    assignmentMethod: {
      type: String,
      enum: [
        "manual",
        "ai_recommended",
        "ai_auto"
      ],
      default: "manual"
    },


    // =====================================================
    // AI SCORE
    // Example: 94.5
    // =====================================================

    aiScore: {
      type: Number,
      default: null
    },


    // =====================================================
    // AI SCORE BREAKDOWN
    // Useful for explaining why AI selected a worker
    // =====================================================

    aiScoreBreakdown: {
      skillMatch: {
        type: Number,
        default: null
      },

      availability: {
        type: Number,
        default: null
      },

      distance: {
        type: Number,
        default: null
      },

      rating: {
        type: Number,
        default: null
      },

      experience: {
        type: Number,
        default: null
      },

      workload: {
        type: Number,
        default: null
      },

      completedJobs: {
        type: Number,
        default: null
      }
    },


    // =====================================================
    // AI ASSIGNMENT TIMESTAMP
    // =====================================================

    aiAssignedAt: {
      type: Date,
      default: null
    }

  },
  {
    timestamps: true
  }
);


// =====================================================
// GEOSPATIAL INDEX
// =====================================================

jobSchema.index({
  location: "2dsphere"
});


module.exports = mongoose.model(
  "Job",
  jobSchema
);