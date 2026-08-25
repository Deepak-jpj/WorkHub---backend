const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    email: {
      type: String,
      required: true,
      unique: true
    },

    phone: {
      type: String
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "worker", "customer"],
      required: true
    },

    skills: {
      type: [String]
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

    isAvailable: {
      type: Boolean,
      default: true
    },

    rating: {
      type: Number,
      default: 4
    },

    experience: {
      type: Number,
      default: 0
    },

    completedJobs: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({
  location: "2dsphere"
});

module.exports = mongoose.model(
  "User",
  userSchema
);