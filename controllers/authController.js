require("dotenv").config();

const User = require("../models/User");
const Job = require("../models/Job");
const PendingRegistration = require("../models/PendingRegistration");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sendVerificationEmail = require("../utils/sendEmail");

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
// =====================================================
// REGISTER USER / WORKER
// SEND EMAIL VERIFICATION OTP
// =====================================================

// =====================================================
// REGISTER CUSTOMER / WORKER
// SEND EMAIL VERIFICATION OTP
// CREATE USER ONLY AFTER OTP VERIFICATION
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
      lng,
    } = req.body;

    

    // =====================================================
    // 1. VALIDATE REQUIRED FIELDS
    // =====================================================

    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, phone, password and role are required.",
      });
    }

    // =====================================================
    // 2. VALIDATE ROLE
    // =====================================================

    if (!["customer", "worker"].includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Only customer and worker registration is allowed.",
      });
    }

    // =====================================================
    // 3. NORMALIZE AND VALIDATE NAME
    // =====================================================

    const normalizedName = String(name).trim();

    if (
      !normalizedName ||
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid name.",
      });
    }

    // =====================================================
    // 4. NORMALIZE AND VALIDATE EMAIL
    // =====================================================

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    // =====================================================
    // 5. VALIDATE PASSWORD
    // Minimum 8 characters, uppercase, lowercase,
    // number and special character
    // =====================================================

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // =====================================================
    // 6. NORMALIZE PHONE NUMBER
    // Uses your existing normalizePhone() function
    // =====================================================

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid Indian mobile number.",
      });
    }

    // =====================================================
    // 7. CHECK EXISTING VERIFIED USER
    // =====================================================

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          existingUser.email === normalizedEmail
            ? "An account with this email already exists."
            : "This phone number is already registered.",
      });
    }

    // =====================================================
    // 8. PREPARE WORKER INFORMATION
    // =====================================================

    const workerSkills =
      role === "worker" && Array.isArray(skills)
        ? [
            ...new Set(
              skills
                .filter(Boolean)
                .map((skill) =>
                  String(skill).trim().toLowerCase()
                )
                .filter(Boolean)
            ),
          ]
        : [];

    const workerExperience =
      role === "worker"
        ? Number(experience || 0)
        : 0;

    if (
      !Number.isFinite(workerExperience) ||
      workerExperience < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Experience must be a valid non-negative number.",
      });
    }

    // =====================================================
    // 9. VALIDATE OPTIONAL LOCATION
    // =====================================================

    let workerLocation;

    const hasLat =
      lat !== undefined &&
      lat !== null &&
      lat !== "";

    const hasLng =
      lng !== undefined &&
      lng !== null &&
      lng !== "";

    if (hasLat !== hasLng) {
      return res.status(400).json({
        success: false,
        message:
          "Provide both latitude and longitude.",
      });
    }

    if (role === "worker" && hasLat && hasLng) {
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid location coordinates.",
        });
      }

      workerLocation = {
        type: "Point",
        coordinates: [longitude, latitude],
      };
    }

    // =====================================================
    // 10. HASH PASSWORD
    // Store only the hash in temporary registration
    // =====================================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // =====================================================
    // 11. GENERATE SIX-DIGIT OTP
    // =====================================================

    const otp = crypto
      .randomInt(100000, 1000000)
      .toString();

    const otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    // OTP expires after five minutes
    const now = new Date();

    const otpExpiresAt = new Date(
      now.getTime() + 5 * 60 * 1000
    );

    // =====================================================
    // 12. SAVE TEMPORARY REGISTRATION
    // Do not create a User account here
    // =====================================================

    const pendingData = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role,
      skills: workerSkills,
      experience: workerExperience,
      otpHash,
      otpExpiresAt,
      lastOtpSentAt: now,
      attempts: 0,
    };

    if (workerLocation) {
      pendingData.location = workerLocation;
    }

    await PendingRegistration.findOneAndUpdate(
      { email: normalizedEmail },
      { $set: pendingData },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    // =====================================================
    // 13. SEND OTP EMAIL
    // =====================================================

    try {
      await sendVerificationEmail(
        normalizedEmail,
        otp
      );
    } catch (emailError) {
      console.error(
        "OTP EMAIL ERROR:",
        emailError.message
      );

      // Remove the temporary registration if sending failed.
      await PendingRegistration.deleteOne({
        email: normalizedEmail,
        otpHash,
      });

      return res.status(503).json({
        success: false,
        message:
          "Unable to send verification email. Please try again.",
      });
    }

    // =====================================================
    // 14. RETURN SUCCESS ONLY AFTER EMAIL IS SENT
    // =====================================================

    console.log(
      "REGISTRATION OTP SENT SUCCESSFULLY:",
      {
        email: normalizedEmail,
        role,
      }
    );

    return res.status(200).json({
      success: true,
      requiresEmailVerification: true,
      message:
        "Verification code sent to your email. It expires in 5 minutes.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error(
      "REGISTRATION ERROR:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This email or phone number is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Registration failed. Please try again.",
    });
  }
};


// =====================================================
// VERIFY REGISTRATION OTP
// CREATE USER ONLY AFTER VERIFICATION
// =====================================================

exports.verifyRegistrationOTP = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const otp = String(req.body.otp || "").trim();

    if (!email || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "A valid email and six-digit OTP are required."
      });
    }

    const pending = await PendingRegistration.findOne({
      email
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: "Registration not found. Please register again."
      });
    }

    // -----------------------------------------------
    // CHECK OTP EXPIRY
    // -----------------------------------------------

    if (pending.otpExpiresAt.getTime() <= Date.now()) {
      await PendingRegistration.deleteOne({
        _id: pending._id
      });

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please register again."
      });
    }

    // -----------------------------------------------
    // LIMIT INCORRECT OTP ATTEMPTS
    // -----------------------------------------------

    if (pending.attempts >= 5) {
      await PendingRegistration.deleteOne({
        _id: pending._id
      });

      return res.status(429).json({
        success: false,
        message: "Too many incorrect attempts. Please register again."
      });
    }

    // -----------------------------------------------
    // VERIFY OTP HASH
    // -----------------------------------------------

    const submittedHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    const validOTP = crypto.timingSafeEqual(
      Buffer.from(submittedHash, "hex"),
      Buffer.from(pending.otpHash, "hex")
    );

    if (!validOTP) {
      pending.attempts += 1;
      await pending.save();

      return res.status(400).json({
        success: false,
        message: `Incorrect OTP. ${5 - pending.attempts} attempt(s) remaining.`
      });
    }

    // -----------------------------------------------
    // RECHECK EMAIL AND PHONE
    // -----------------------------------------------

    const existingUser = await User.findOne({
      $or: [
        { email: pending.email },
        { phone: pending.phone }
      ]
    });

    if (existingUser) {
      await PendingRegistration.deleteOne({
        _id: pending._id
      });

      return res.status(409).json({
        success: false,
        message: "This email or phone number is already registered."
      });
    }

    // -----------------------------------------------
    // CREATE VERIFIED USER
    // -----------------------------------------------

    const userData = {
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      password: pending.password,
      role: pending.role,
      skills: pending.skills || [],
      experience: pending.experience || 0,
      rating: 4,
      completedJobs: 0,
      isAvailable: true,
      isEmailVerified: true
    };

    if (pending.location) {
      userData.location = pending.location;
    }

    const newUser = new User(userData);

    await newUser.save();

    // Remove temporary registration after successful creation.
    await PendingRegistration.deleteOne({
      _id: pending._id
    });

    const userResponse = newUser.toObject();

    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: "Email verified and account created successfully.",
      user: userResponse
    });

  } catch (error) {
    console.error("OTP VERIFICATION ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This email or phone number is already registered."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Email verification failed. Please try again."
    });
  }
};


// =====================================================
// RESEND REGISTRATION OTP
// =====================================================

exports.resendRegistrationOTP = async (req, res) => {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required."
      });
    }

    const pending = await PendingRegistration.findOne({
      email
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        message: "Pending registration not found. Please register again."
      });
    }

    // -----------------------------------------------
    // APPLY A RESEND COOLDOWN
    // -----------------------------------------------

    const now = Date.now();

    if (
      pending.lastOtpSentAt &&
      now - pending.lastOtpSentAt.getTime() < 60 * 1000
    ) {
      return res.status(429).json({
        success: false,
        message: "Please wait 60 seconds before requesting another OTP."
      });
    }

    // -----------------------------------------------
    // GENERATE NEW OTP
    // -----------------------------------------------

    const otp = crypto.randomInt(100000, 1000000).toString();

    pending.otpHash = crypto
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    pending.otpExpiresAt = new Date(now + 5 * 60 * 1000);
    pending.attempts = 0;
    pending.lastOtpSentAt = new Date(now);

    await pending.save();

    try {
      await sendVerificationEmail(email, otp);
    } catch (emailError) {
      console.error("RESEND OTP EMAIL ERROR:", emailError.message);

      // Invalidate the unsent OTP.
      await PendingRegistration.deleteOne({
        _id: pending._id
      });

      return res.status(503).json({
        success: false,
        message: "Unable to send OTP. Please register again."
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new verification code has been sent."
    });

  } catch (error) {
    console.error("RESEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to resend OTP."
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