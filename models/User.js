const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // User's full name
    name: {
      type: String,
      required: true,
      trim: true
    },

    // Email address
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    // Phone number
    phone: {
      type: String,
      trim: true
    },

    // Hashed password - excluded from normal queries
    password: {
      type: String,
      required: true,
      select: false
    },

    // User role
    role: {
      type: String,
      enum: ["admin", "worker", "customer"],
      required: true
    },

    // Email verification status
    isEmailVerified: {
      type: Boolean,
      default: false,
      required: true
    },

    // Worker's skills
    skills: {
      type: [String],
      default: []
    },

    // User's geographical location
    location: {
      type: {
        type: String,
        enum: ["Point"]
      },
      coordinates: {
        type: [Number]
      }
    },

    // Worker availability
    isAvailable: {
      type: Boolean,
      default: true
    },

    // User rating
    rating: {
      type: Number,
      default: 4,
      min: 0,
      max: 5
    },

    // Work experience in years
    experience: {
      type: Number,
      default: 0,
      min: 0
    },

    // Number of completed jobs
    completedJobs: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Geospatial index for location-based worker matching
userSchema.index({
  location: "2dsphere"
});

module.exports = mongoose.model("User", userSchema);