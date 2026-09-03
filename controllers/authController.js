require("dotenv").config();

const User = require("../models/User");
const Job = require("../models/Job");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================================
// PHONE NUMBER NORMALIZATION
// =====================================================

function normalizePhone(phone) {
  if (!phone) return null;

  let value = String(phone)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (value.startsWith("+91") && value.length === 13) {
    return /^(\+91)[6-9]\d{9}$/.test(value) ? value : null;
  }

  if (value.startsWith("91") && value.length === 12) {
    return /^91[6-9]\d{9}$/.test(value)
      ? `+${value}`
      : null;
  }

  if (/^[6-9]\d{9}$/.test(value)) {
    return `+91${value}`;
  }

  return null;
}

// =====================================================
// REGISTER USER / WORKER
// NO OTP
// =====================================================

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      skills,
      experience,
      lat,
      lng
    } = req.body;

    console.log("\n========================================");
    console.log("📝 REGISTRATION REQUEST");
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Phone:", phone);
    console.log("Role:", role);
    console.log("========================================\n");

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (
      !name ||
      !email ||
      !password ||
      !role ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password and role are required."
      });
    }

    // -------------------------------------------------
    // VALID ROLE
    // -------------------------------------------------

    if (
      role !== "customer" &&
      role !== "worker"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only customer and worker registration is allowed."
      });
    }

    // -------------------------------------------------
    // NORMALIZE PHONE
    // -------------------------------------------------

    const normalizedPhone =
      normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Indian mobile number."
      });
    }

    // -------------------------------------------------
    // CHECK EMAIL
    // -------------------------------------------------

    const normalizedEmail =
      email.trim().toLowerCase();

    const existingEmail =
      await User.findOne({
        email: normalizedEmail
      });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "User with this email already exists."
      });
    }

    // -------------------------------------------------
    // CHECK PHONE
    // -------------------------------------------------

    const existingPhone =
      await User.findOne({
        phone: normalizedPhone
      });

    if (existingPhone) {
      return res.status(400).json({
        success: false,
        message:
          "This phone number is already registered."
      });
    }

    // -------------------------------------------------
    // HASH PASSWORD
    // -------------------------------------------------

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // -------------------------------------------------
    // WORKER SKILLS
    // -------------------------------------------------

    let workerSkills = [];

    if (
      role === "worker" &&
      Array.isArray(skills)
    ) {
      workerSkills = skills
        .filter(Boolean)
        .map((skill) =>
          String(skill)
            .toLowerCase()
            .trim()
        );
    }

    // -------------------------------------------------
    // EXPERIENCE
    // -------------------------------------------------

    const workerExperience =
      role === "worker"
        ? Number(experience) || 0
        : 0;

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    const newUser = new User({
      name: name.trim(),

      email: normalizedEmail,

      phone: normalizedPhone,

      password: hashedPassword,

      role,

      skills: workerSkills,

      experience: workerExperience,

      rating: 4,

      completedJobs: 0,

      isAvailable: true
    });

    // -------------------------------------------------
    // WORKER LOCATION
    // -------------------------------------------------

    if (
      role === "worker" &&
      lat !== undefined &&
      lng !== undefined
    ) {
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        newUser.location = {
          type: "Point",
          coordinates: [
            longitude,
            latitude
          ]
        };
      }
    }

    // -------------------------------------------------
    // SAVE USER
    // -------------------------------------------------

    await newUser.save();

    const userResponse =
      newUser.toObject();

    delete userResponse.password;

    console.log("\n========================================");
    console.log("✅ USER REGISTERED SUCCESSFULLY");
    console.log("Name:", userResponse.name);
    console.log("Phone:", userResponse.phone);
    console.log("Role:", userResponse.role);
    console.log("========================================\n");

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully.",
      user: userResponse
    });

  } catch (error) {
    console.error(
      "❌ REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Registration failed.",
      error: error.message
    });
  }
};

// =====================================================
// LOGIN USER
// =====================================================

exports.loginUser = async (req, res) => {
  try {
    const email =
      String(req.body.email || "")
        .trim()
        .toLowerCase();

    const password =
      String(req.body.password || "");

    console.log("\n========================================");
    console.log("🔐 LOGIN REQUEST");
    console.log("Email:", email);
    console.log("========================================\n");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required."
      });
    }

    const user =
      await User.findOne({
        email: {
          $regex: `^${email}$`,
          $options: "i"
        }
      });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found"
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid credentials"
      });
    }

    const token =
      jwt.sign(
        {
          id: user._id,
          role: user.role
        },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d"
        }
      );

    const userResponse =
      user.toObject();

    delete userResponse.password;

    console.log(
      "✅ LOGIN SUCCESS:",
      {
        email: userResponse.email,
        role: userResponse.role
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Login successful",

      role:
        userResponse.role,

      token,

      user:
        userResponse
    });

  } catch (error) {
    console.error(
      "❌ LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login failed",
      error:
        error.message
    });
  }
};

// =====================================================
// WORKER COMPLETES JOB
// =====================================================

exports.completeJob = async (
  req,
  res
) => {
  try {
    if (
      req.user.role !== "worker"
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
          "Not your job"
      });
    }

    job.status = "completed";

    await job.save();

    return res.json({
      message:
        "Job marked as completed"
    });

  } catch (error) {
    return res.status(500).json({
      error:
        error.message
    });
  }
};

// =====================================================
// GET ALL WORKERS
// =====================================================

exports.getWorkers =
  async (req, res) => {
    try {
      const workers =
        await User.find({
          role: "worker"
        })
          .select("-password")
          .sort({
            createdAt: -1
          });

      return res.json(workers);

    } catch (error) {
      console.error(
        "GET WORKERS ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error.message
      });
    }
  };

// =====================================================
// GET PUBLIC WORKERS
// HOMEPAGE MAP
// =====================================================

exports.getPublicWorkers =
  async (req, res) => {
    try {
      const workers =
        await User.find({
          role: "worker",
          location: {
            $exists: true
          }
        })
          .select(
            "name skills experience rating isAvailable location"
          )
          .sort({
            createdAt: -1
          });

      return res.json(workers);

    } catch (error) {
      console.error(
        "GET PUBLIC WORKERS ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error.message
      });
    }
  };

// =====================================================
// GET ALL CUSTOMERS
// =====================================================

exports.getCustomers =
  async (req, res) => {
    try {
      const customers =
        await User.find({
          role: "customer"
        })
          .select("-password")
          .sort({
            createdAt: -1
          });

      return res.json(customers);

    } catch (error) {
      console.error(
        "GET CUSTOMERS ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error.message
      });
    }
  };

// =====================================================
// DELETE USER
// ADMIN ONLY
// =====================================================

exports.deleteUser =
  async (req, res) => {
    try {
      if (
        !req.user ||
        req.user.role !== "admin"
      ) {
        return res.status(403).json({
          message:
            "Only admin can remove users"
        });
      }

      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          message:
            "User not found"
        });
      }

      if (user.role === "admin") {
        return res.status(403).json({
          message:
            "Admin account cannot be removed"
        });
      }

      await User.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        message:
          `${user.role} removed successfully`
      });

    } catch (error) {
      console.error(
        "DELETE USER ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error.message
      });
    }
  };

// =====================================================
// UPDATE WORKER AVAILABILITY
// =====================================================

exports.updateAvailability =
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.user.id
        );

      if (
        !user ||
        user.role !== "worker"
      ) {
        return res.status(403).json({
          message:
            "Only workers can change availability"
        });
      }

      user.isAvailable =
        !user.isAvailable;

      await user.save();

      return res.json({
        message:
          user.isAvailable
            ? "You are now available"
            : "You are now unavailable",

        isAvailable:
          user.isAvailable
      });

    } catch (error) {
      console.error(
        "UPDATE AVAILABILITY ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update availability"
      });
    }
  };

// =====================================================
// UPDATE WORKER LOCATION
// =====================================================

exports.updateLocation =
  async (req, res) => {
    try {
      if (
        !req.user ||
        req.user.role !== "worker"
      ) {
        return res.status(403).json({
          message:
            "Only workers can update location"
        });
      }

      const {
        lat,
        lng
      } = req.body;

      const latitude = Number(lat);
      const longitude = Number(lng);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return res.status(400).json({
          message:
            "Valid latitude and longitude are required"
        });
      }

      if (
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          message:
            "Invalid location coordinates"
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

      worker.location = {
        type: "Point",
        coordinates: [
          longitude,
          latitude
        ]
      };

      await worker.save();

      return res.json({
        message:
          "Worker location updated successfully",

        location:
          worker.location
      });

    } catch (error) {
      console.error(
        "UPDATE LOCATION ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update location",

        error:
          error.message
      });
    }
  };