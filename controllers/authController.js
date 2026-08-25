const User = require("../models/User");
const Job = require("../models/Job");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

global.demoOtps = global.demoOtps || {};

function normalizePhone(phone) {
  if (!phone) return null;

  let value = String(phone)
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (value.startsWith("+91") && value.length === 13) {
    return value;
  }

  if (value.startsWith("91") && value.length === 12) {
    return `+${value}`;
  }

  if (/^[6-9]\d{9}$/.test(value)) {
    return `+91${value}`;
  }

  return null;
}


// =====================================================
// SEND OTP
// =====================================================

exports.sendOtp = async (req, res) => {
  try {
    const mobile = normalizePhone(req.body.phone);

    if (!mobile) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit Indian mobile number."
      });
    }

    const existingUser = await User.findOne({
      phone: mobile
    });

    if (existingUser) {
      return res.status(400).json({
        message: "This phone number is already registered."
      });
    }

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    global.demoOtps[mobile] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    console.log("");
    console.log("========================================");
    console.log("📱 DEMO OTP GENERATED");
    console.log("Phone:", mobile);
    console.log("OTP:", otp);
    console.log("Expires in: 5 minutes");
    console.log("========================================");
    console.log("");

    return res.status(200).json({
      message: "OTP generated successfully. Check the backend terminal.",
      success: true
    });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
      message: "Unable to generate OTP."
    });
  }
};


// =====================================================
// VERIFY OTP
// =====================================================

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const mobile = normalizePhone(phone);

    if (!mobile) {
      return res.status(400).json({
        message: "Invalid phone number.",
        verified: false
      });
    }

    if (!otp || String(otp).length !== 6) {
      return res.status(400).json({
        message: "Please enter the 6-digit OTP.",
        verified: false
      });
    }

    const storedOtp = global.demoOtps[mobile];

    if (!storedOtp) {
      return res.status(400).json({
        message: "OTP not found. Please click Send OTP again.",
        verified: false
      });
    }

    if (Date.now() > storedOtp.expiresAt) {
      delete global.demoOtps[mobile];

      return res.status(400).json({
        message: "OTP has expired. Please request a new OTP.",
        verified: false
      });
    }

    if (String(otp) !== String(storedOtp.otp)) {
      return res.status(400).json({
        message: "Invalid OTP. Please try again.",
        verified: false
      });
    }

    delete global.demoOtps[mobile];

    console.log("========================================");
    console.log("✅ OTP VERIFIED SUCCESSFULLY");
    console.log("Phone:", mobile);
    console.log("========================================");

    const otpVerificationToken = jwt.sign(
      {
        phone: mobile,
        otpVerified: true
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m"
      }
    );

    return res.status(200).json({
      message: "Phone number verified successfully.",
      verified: true,
      otpVerificationToken
    });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      message: "Unable to verify OTP.",
      verified: false
    });
  }
};


// =====================================================
// REGISTER USER / WORKER
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
      otpVerificationToken
    } = req.body;

    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({
        message: "Name, email, phone, password and role are required."
      });
    }

    if (role !== "customer" && role !== "worker") {
      return res.status(400).json({
        message: "Only customer and worker registration is allowed."
      });
    }

    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone) {
      return res.status(400).json({
        message: "Please enter a valid Indian mobile number."
      });
    }

    // =================================================
    // WORKER OTP VERIFICATION
    // =================================================

    if (role === "worker") {
      if (!otpVerificationToken) {
        return res.status(403).json({
          message:
            "Please verify your phone number with OTP before registering as a worker."
        });
      }

      let decodedToken;

      try {
        decodedToken = jwt.verify(
          otpVerificationToken,
          process.env.JWT_SECRET
        );
      } catch (tokenError) {
        return res.status(403).json({
          message:
            "OTP verification has expired. Please verify your phone number again."
        });
      }

      if (decodedToken.otpVerified !== true) {
        return res.status(403).json({
          message: "Phone number is not verified."
        });
      }

      if (decodedToken.phone !== normalizedPhone) {
        return res.status(403).json({
          message:
            "The verified phone number does not match the registration phone number."
        });
      }
    }

    // =================================================
    // CHECK EMAIL
    // =================================================

    const existingEmail = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (existingEmail) {
      return res.status(400).json({
        message: "User with this email already exists."
      });
    }

    // =================================================
    // CHECK PHONE
    // =================================================

    const existingPhone = await User.findOne({
      phone: normalizedPhone
    });

    if (existingPhone) {
      return res.status(400).json({
        message: "This phone number is already registered."
      });
    }

    // =================================================
    // HASH PASSWORD
    // =================================================

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // =================================================
    // WORKER SKILLS
    // =================================================

    let workerSkills = [];

    if (role === "worker" && Array.isArray(skills)) {
      workerSkills = skills
        .filter((skill) => skill)
        .map((skill) =>
          String(skill).toLowerCase().trim()
        );
    }

    // =================================================
    // WORKER EXPERIENCE
    // =================================================

    const workerExperience =
      role === "worker"
        ? Number(experience) || 0
        : 0;

    // =================================================
    // CREATE USER
    // =================================================

    const newUser = new User({
      name,
      email: email.trim().toLowerCase(),
      phone: normalizedPhone,
      password: hashedPassword,
      role,
      skills: workerSkills,
      experience: workerExperience,
      rating: 4,
      completedJobs: 0,
      isAvailable: true
    });

    // =================================================
    // WORKER LOCATION
    // =================================================

    if (
      role === "worker" &&
      lat !== undefined &&
      lat !== null &&
      lng !== undefined &&
      lng !== null
    ) {
      const latitude = Number(lat);
      const longitude = Number(lng);

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude)
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

    await newUser.save();

    const userResponse = newUser.toObject();

    delete userResponse.password;

    return res.status(201).json({
      message: "User registered successfully.",
      user: userResponse
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      error: error.message
    });
  }
};


// =====================================================
// LOGIN USER
// =====================================================

exports.loginUser = async (req, res) => {
  try {
    const email = String(
      req.body.email || ""
    ).trim().toLowerCase();

    const password = String(
      req.body.password || ""
    );

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const user = await User.findOne({
      email: {
        $regex: `^${email}$`,
        $options: "i"
      }
    });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d"
      }
    );

    const userResponse = user.toObject();

    delete userResponse.password;

    console.log("LOGIN SUCCESS:", {
      email: userResponse.email,
      role: userResponse.role
    });

    return res.status(200).json({
      message: "Login successful",
      role: userResponse.role,
      token,
      user: userResponse
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Login failed",
      error: error.message
    });
  }
};


// =====================================================
// WORKER COMPLETES JOB
// =====================================================

exports.completeJob = async (req, res) => {
  try {
    if (req.user.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can complete jobs"
      });
    }

    const job = await Job.findById(
      req.params.id
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found"
      });
    }

    if (
      !job.worker ||
      job.worker.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Not your job"
      });
    }

    job.status = "completed";

    await job.save();

    res.json({
      message: "Job marked as completed"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// =====================================================
// GET ALL WORKERS
// =====================================================

exports.getWorkers = async (req, res) => {
  try {
    const workers = await User.find({
      role: "worker"
    })
      .select("-password")
      .sort({
        createdAt: -1
      });

    res.json(workers);

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


// =====================================================
// GET PUBLIC WORKERS
// HOMEPAGE MAP
// =====================================================

exports.getPublicWorkers = async (req, res) => {
  try {
    const workers = await User.find({
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

    res.json(workers);

  } catch (error) {
    console.error(
      "GET PUBLIC WORKERS ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};


// =====================================================
// GET ALL CUSTOMERS
// =====================================================

exports.getCustomers = async (req, res) => {
  try {
    const customers = await User.find({
      role: "customer"
    })
      .select("-password")
      .sort({
        createdAt: -1
      });

    res.json(customers);

  } catch (error) {
    console.error(
      "GET CUSTOMERS ERROR:",
      error
    );

    res.status(500).json({
      error: error.message
    });
  }
};


// =====================================================
// DELETE WORKER / CUSTOMER
// ADMIN ONLY
// =====================================================

exports.deleteUser = async (req, res) => {
  try {
    if (
      !req.user ||
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Only admin can remove users"
      });
    }

    const userId = req.params.id;

    const user = await User.findById(
      userId
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        message: "Admin account cannot be removed"
      });
    }

    await User.findByIdAndDelete(
      userId
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
      error: error.message
    });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can change availability"
      });
    }

    user.isAvailable = !user.isAvailable;
    await user.save();

    res.json({
      message: user.isAvailable
        ? "You are now available"
        : "You are now unavailable",
      isAvailable: user.isAvailable
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update availability"
    });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    if (!req.user || req.user.role !== "worker") {
      return res.status(403).json({
        message: "Only workers can update location"
      });
    }

    const { lat, lng } = req.body;

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message: "Valid latitude and longitude are required"
      });
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return res.status(400).json({
        message: "Invalid location coordinates"
      });
    }

    const worker = await User.findById(
      req.user.id
    );

    if (!worker) {
      return res.status(404).json({
        message: "Worker not found"
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

    res.json({
      message: "Worker location updated successfully",
      location: worker.location
    });

  } catch (error) {
    console.error(
      "UPDATE LOCATION ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to update location",
      error: error.message
    });
  }
};