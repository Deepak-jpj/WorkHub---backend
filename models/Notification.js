const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: [
        "job_request",
        "job_accepted",
        "job_rejected",
        "job_started",
        "job_completed",
        "payment_requested",
        "payment_paid",
        "review"
      ],
      required: true
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({
  recipient: 1,
  createdAt: -1
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);