const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["customer", "worker"],
      required: true
    },

    skills: {
      type: [String],
      default: []
    },

    experience: {
      type: Number,
      default: 0
    },

    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    },

    otpHash: {
      type: String,
      required: true
    },

    otpExpiresAt: {
      type: Date,
      required: true
    },

    attempts: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Automatically remove expired pending registrations.
pendingRegistrationSchema.index(
  { otpExpiresAt: 1 },
  { expireAfterSeconds: 0 }
);

// Only one pending registration per email.
pendingRegistrationSchema.index(
  { email: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "PendingRegistration",
  pendingRegistrationSchema
);