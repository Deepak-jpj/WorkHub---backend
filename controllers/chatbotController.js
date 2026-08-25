const User = require("../models/User");
const Job = require("../models/Job");
const { rankWorkers } = require("../utils/workerMatcher");

// =====================================================
// PENDING CHATBOT HIRE
// =====================================================

const pendingHires = new Map();


// =====================================================
// TEXT HELPERS
// =====================================================

function normalize(text = "") {

  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[?!.,]/g, " ")
    .replace(/\s+/g, " ");

}


function has(text, words = []) {

  return words.some((word) =>
    text.includes(word)
  );

}


// =====================================================
// CATEGORY DETECTION
// =====================================================

function detectCategory(q) {

  // ---------------------------------------------------
  // PLUMBER
  // ---------------------------------------------------

  if (
    has(q, [

      "plumber",
      "plumbing",
      "pipe",
      "pipe repair",
      "water pipe",
      "water leak",
      "water leakage",
      "leakage",
      "leaking pipe",
      "tap",
      "faucet",
      "sink",
      "toilet",
      "bathroom",
      "drain",
      "drainage",
      "blocked drain",
      "clogged drain",
      "water problem",
      "water tank",
      "water tap"

    ])
  ) {

    return "plumber";

  }


  // ---------------------------------------------------
  // ELECTRICIAN
  // ---------------------------------------------------

  if (
    has(q, [

      "electrician",
      "electrical",
      "electric",
      "wiring",
      "wire",
      "wires",
      "power problem",
      "power issue",
      "electric problem",
      "electricity problem",
      "current problem",
      "light problem",
      "lights not working",
      "light not working",
      "fan not working",
      "switch not working",
      "socket not working",
      "plug not working",
      "short circuit",
      "fuse",
      "voltage",
      "power cut"

    ])
  ) {

    return "electrician";

  }


  // ---------------------------------------------------
  // CARPENTER
  // ---------------------------------------------------

  if (
    has(q, [

      "carpenter",
      "carpentry",
      "wood work",
      "woodwork",
      "wooden work",
      "wood repair",
      "door repair",
      "wooden door",
      "furniture repair",
      "furniture",
      "table repair",
      "chair repair",
      "cupboard repair",
      "cabinet repair",
      "bed repair"

    ])
  ) {

    return "carpenter";

  }


  // ---------------------------------------------------
  // PAINTER
  // ---------------------------------------------------

  if (
    has(q, [

      "painter",
      "painting",
      "paint",
      "wall painting",
      "house painting",
      "room painting",
      "paint my house",
      "paint the house",
      "paint my room"

    ])
  ) {

    return "painter";

  }


  // ---------------------------------------------------
  // CLEANING
  // ---------------------------------------------------

  if (
    has(q, [

      "cleaner",
      "cleaning",
      "clean my house",
      "clean my room",
      "house cleaning",
      "home cleaning",
      "office cleaning",
      "room cleaning",
      "deep cleaning"

    ])
  ) {

    return "cleaning";

  }


  // ---------------------------------------------------
  // MECHANIC
  // ---------------------------------------------------

  if (
    has(q, [

      "mechanic",
      "vehicle repair",
      "bike repair",
      "car repair",
      "vehicle problem",
      "bike problem",
      "car problem",
      "engine problem",
      "engine repair",
      "puncture",
      "tyre",
      "tire"

    ])
  ) {

    return "mechanic";

  }


  // ---------------------------------------------------
  // DRIVER
  // ---------------------------------------------------

  if (
    has(q, [

      "driver",
      "driving",
      "need a driver",
      "hire a driver",
      "car driver",
      "vehicle driver"

    ])
  ) {

    return "driver";

  }


  // ---------------------------------------------------
  // SECURITY
  // ---------------------------------------------------

  if (
    has(q, [

      "security",
      "security guard",
      "guard",
      "watchman",
      "security person"

    ])
  ) {

    return "security";

  }


  // ---------------------------------------------------
  // STAFF / HELPER
  // ---------------------------------------------------

  if (
    has(q, [

      "staff",
      "helper",
      "assistant",
      "someone to help",
      "general worker",
      "daily worker",
      "labour",
      "labor",
      "worker for help"

    ])
  ) {

    return "staff";

  }


  // ---------------------------------------------------
  // TECHNICIAN
  // ---------------------------------------------------

  if (
    has(q, [

      "technician",
      "technical problem",
      "technical issue",
      "machine repair",
      "machine problem"

    ])
  ) {

    return "technician";

  }


  // ---------------------------------------------------
  // CONSTRUCTION
  // ---------------------------------------------------

  if (
    has(q, [

      "construction",
      "construction worker",
      "mason",
      "masonry",
      "building work",
      "building repair",
      "cement work",
      "brick work",
      "brickwork"

    ])
  ) {

    return "construction";

  }


  return null;

}


// =====================================================
// SKILL MATCHING
// =====================================================

function skillMatches(worker, category) {

  let skills = [];


  // Worker skills may be an array or a single string
  if (Array.isArray(worker.skills)) {

    skills = worker.skills;

  } else if (typeof worker.skills === "string") {

    skills = worker.skills
      .split(",")
      .map((skill) => skill.trim());

  }


  skills = skills.map(normalize);


  const aliases = {

    plumber: [
      "plumber",
      "plumbing",
      "pipe repair",
      "bathroom repair"
    ],

    electrician: [
      "electrician",
      "electrical",
      "electric",
      "wiring",
      "wire",
      "electrical repair"
    ],

    carpenter: [
      "carpenter",
      "carpentry",
      "wood work",
      "woodwork"
    ],

    painter: [
      "painter",
      "painting",
      "paint"
    ],

    cleaning: [
      "cleaning",
      "cleaner"
    ],

    mechanic: [
      "mechanic"
    ],

    driver: [
      "driver",
      "driving"
    ],

    security: [
      "security",
      "security guard",
      "guard",
      "watchman"
    ],

    staff: [
      "staff",
      "helper",
      "assistant",
      "general worker"
    ],

    technician: [
      "technician"
    ],

    construction: [
      "construction",
      "construction worker",
      "mason",
      "masonry"
    ]

  };


  return (aliases[category] || [])
    .some((skill) =>
      skills.includes(skill)
    );

}


// =====================================================
// FIND + RANK WORKERS
// =====================================================

async function findWorkers(category) {

  const workers = await User.find({

    role: "worker",

    isAvailable: true

  });


  const matchingWorkers = workers.filter(
    (worker) =>
      skillMatches(worker, category)
  );


  // Convert MongoDB documents into safe objects
  const safeWorkers =
    matchingWorkers.map((worker) => {

      const workerObject =
        worker.toObject
          ? worker.toObject()
          : worker;


      // Make sure distance is always valid
      const distance =
        Number(workerObject.distanceKm);


      workerObject.distanceKm =
        Number.isFinite(distance)
          ? distance
          : 5;


      return workerObject;

    });


  if (!safeWorkers.length) {

    return [];

  }


  try {

    return rankWorkers(

      {
        category
      },

      safeWorkers

    );

  } catch (error) {

    console.error(
      "Worker ranking error:",
      error
    );


    // Fallback ranking if matcher fails
    return safeWorkers.map(
      (worker) => ({

        workerId:
          worker._id,

        name:
          worker.name,

        email:
          worker.email,

        skills:
          worker.skills || [],

        rating:
          Number(worker.rating) || 0,

        experience:
          Number(worker.experience) || 0,

        completedJobs:
          Number(worker.completedJobs) || 0,

        isAvailable:
          worker.isAvailable,

        distanceKm:
          Number(worker.distanceKm) || 5,

        matchScore:
          0,

        breakdown: {}

      })
    );

  }

}


// =====================================================
// URGENT REQUEST
// =====================================================

function isUrgent(q) {

  return has(q, [

    "urgent",
    "urgently",
    "right now",
    "asap",
    "immediately",
    "emergency",
    "need someone now",
    "send someone",
    "send a worker",
    "send him",
    "send her",
    "send them"

  ]);

}


// =====================================================
// YES
// =====================================================

function isYes(q) {

  return has(q, [

    "yes",
    "yeah",
    "yep",
    "yup",
    "sure",
    "okay",
    "ok",
    "confirm",
    "confirmed",
    "send it",
    "send request",
    "send the request",
    "do it",
    "go ahead",
    "hire him",
    "hire her",
    "hire them"

  ]);

}


// =====================================================
// NO
// =====================================================

function isNo(q) {

  return has(q, [

    "no",
    "nope",
    "cancel",
    "don't",
    "do not",
    "not now",
    "forget it"

  ]);

}


// =====================================================
// CREATE REAL JOB
// =====================================================

async function createChatbotJob(
  customerId,
  workerId,
  category,
  lat,
  lng
) {

  // ---------------------------------------------------
  // Validate location
  // ---------------------------------------------------

  const latitude =
    Number(lat);

  const longitude =
    Number(lng);


  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    return {

      success: false,

      message:
        "I need your current location to send the hire request. Please allow location access and try again."

    };

  }


  // ---------------------------------------------------
  // Find worker
  // ---------------------------------------------------

  const worker =
    await User.findOne({

      _id: workerId,

      role: "worker"

    });


  if (!worker) {

    return {

      success: false,

      message:
        "The selected worker could not be found."

    };

  }


  // ---------------------------------------------------
  // Check worker availability
  // ---------------------------------------------------

  if (!worker.isAvailable) {

    return {

      success: false,

      message:
        "Sorry, that worker is no longer available. Please try another worker."

    };

  }


  // ---------------------------------------------------
  // Create REAL JOB
  // ---------------------------------------------------

  const job =
    new Job({

      title:
        `Hire ${worker.name}`,

      description:
        `Hire request for ${category} sent through chatbot.`,

      customer:
        customerId,

      worker:
        worker._id,

      category:
        category,

      payment:
        0,

      location: {

        type:
          "Point",

        // GeoJSON:
        // [longitude, latitude]

        coordinates: [

          longitude,

          latitude

        ]

      },

      status:
        "pending"

    });


  await job.save();


  return {

    success: true,

    job

  };

}


// =====================================================
// WORKER CHATBOT
// =====================================================

async function workerChatbot(
  userId,
  q,
  res
) {

  const worker =
    await User.findById(userId);


  if (!worker) {

    return res.status(404).json({

      message:
        "Worker not found."

    });

  }


  const name =
    worker.name || "Worker";


  // ---------------------------------------------------
  // GREETING
  // ---------------------------------------------------

  if (
    has(q, [

      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening"

    ])
  ) {

    return res.json({

      reply:
        `Hello ${name}! 👋\n\n` +
        `I can help you with your jobs, ` +
        `availability, rating, experience, ` +
        `skills and hire requests.`

    });

  }


  // ---------------------------------------------------
  // THANKS
  // ---------------------------------------------------

  if (
    has(q, [

      "thank you",
      "thanks",
      "thank u",
      "thankyou"

    ])
  ) {

    return res.json({

      reply:
        "You're welcome! 😊"

    });

  }


  // ---------------------------------------------------
  // COMPLETED JOBS
  // ---------------------------------------------------

  if (
    q.includes("completed") &&
    q.includes("job")
  ) {

    return res.json({

      reply:
        `You have completed ${worker.completedJobs || 0} jobs. 🎉`

    });

  }


  // ---------------------------------------------------
  // AVAILABILITY
  // ---------------------------------------------------

  if (
    has(q, [

      "available",
      "availability",
      "am i free",
      "am i busy",
      "my status"

    ])
  ) {

    return res.json({

      reply:
        `Your current status is ` +
        `${worker.isAvailable ? "Available 🟢" : "Busy 🔴"}.`

    });

  }


  // ---------------------------------------------------
  // RATING
  // ---------------------------------------------------

  if (
    has(q, [

      "rating",
      "review",
      "stars"

    ])
  ) {

    return res.json({

      reply:
        `Your current rating is ⭐ ${worker.rating || 0}/5.`

    });

  }


  // ---------------------------------------------------
  // EXPERIENCE
  // ---------------------------------------------------

  if (
    q.includes("experience")
  ) {

    return res.json({

      reply:
        `You have ${worker.experience || 0} years of experience.`

    });

  }


  // ---------------------------------------------------
  // SKILLS
  // ---------------------------------------------------

  if (
    has(q, [

      "skill",
      "skills",
      "my work"

    ])
  ) {

    let skills = [];

    if (Array.isArray(worker.skills)) {

      skills = worker.skills;

    } else if (
      typeof worker.skills === "string"
    ) {

      skills =
        worker.skills.split(",");

    }


    const skillText =
      skills.length
        ? skills.join(", ")
        : "No skills registered";


    return res.json({

      reply:
        `Your registered skills are: ${skillText}. 🛠️`

    });

  }


  // ---------------------------------------------------
  // CURRENT JOB
  // ---------------------------------------------------

  if (
    has(q, [

      "current job",
      "accepted job",
      "active job",
      "ongoing job"

    ])
  ) {

    const job =
      await Job.findOne({

        worker: userId,

        status: "accepted"

      })
        .populate(
          "customer",
          "name email phone"
        )
        .sort({

          createdAt: -1

        });


    if (!job) {

      return res.json({

        reply:
          "You currently don't have an accepted job. 👍"

      });

    }


    return res.json({

      reply:
        `📋 Current Job\n\n` +

        `Job: ${job.title}\n` +

        `Customer: ${job.customer?.name || "Unknown"}\n` +

        `Phone: ${job.customer?.phone || "Not available"}\n` +

        `Category: ${job.category || "Other"}\n` +

        `Payment: ₹${job.payment || 0}\n` +

        `Status: Accepted 🟢`

    });

  }


  // ---------------------------------------------------
  // PENDING REQUESTS
  // ---------------------------------------------------

  if (
    has(q, [

      "pending request",
      "pending requests",
      "hire request",
      "hire requests",
      "new request",
      "new requests"

    ])
  ) {

    const jobs =
      await Job.find({

        worker: userId,

        status: "pending"

      })
        .populate(
          "customer",
          "name email phone"
        )
        .sort({

          createdAt: -1

        })
        .limit(5);


    if (!jobs.length) {

      return res.json({

        reply:
          "You currently don't have any pending hire requests. 👍"

      });

    }


    const reply =
      jobs.map(

        (job, i) =>

          `${i + 1}. ${job.title}\n` +

          `Customer: ${job.customer?.name || "Unknown"}\n` +

          `Category: ${job.category || "Other"}\n` +

          `Payment: ₹${job.payment || 0}`

      ).join("\n\n");


    return res.json({

      reply:
        `📨 Pending Requests\n\n${reply}`

    });

  }


  // ---------------------------------------------------
  // ACCEPT JOB HELP
  // ---------------------------------------------------

  if (
    q.includes("accept") &&
    q.includes("job")
  ) {

    return res.json({

      reply:
        "Open your Worker Dashboard, find the pending request and click 'Accept Job'."

    });

  }


  // ---------------------------------------------------
  // COMPLETE JOB HELP
  // ---------------------------------------------------

  if (
    q.includes("complete") &&
    q.includes("job")
  ) {

    return res.json({

      reply:
        "After finishing the work, click 'Complete Job' on your Worker Dashboard."

    });

  }


  // ---------------------------------------------------
  // PROFILE
  // ---------------------------------------------------

  if (
    has(q, [

      "my profile",
      "my information",
      "about me"

    ])
  ) {

    return res.json({

      reply:
        `👤 Profile\n\n` +

        `Name: ${worker.name}\n` +

        `Email: ${worker.email}\n` +

        `Experience: ${worker.experience || 0} years\n` +

        `Rating: ⭐ ${worker.rating || 0}/5\n` +

        `Completed Jobs: ${worker.completedJobs || 0}\n` +

        `Status: ${worker.isAvailable ? "Available 🟢" : "Busy 🔴"}`

    });

  }


  return res.json({

    reply:
      `I can help you with:\n\n` +

      `• Completed jobs\n` +

      `• Current job\n` +

      `• Availability\n` +

      `• Rating\n` +

      `• Experience\n` +

      `• Skills\n` +

      `• Hire requests\n` +

      `• Accepting jobs\n` +

      `• Completing jobs`

  });

}


// =====================================================
// CUSTOMER CHATBOT
// =====================================================

async function customerChatbot(
  userId,
  q,
  lat,
  lng,
  res
) {

  // ===================================================
  // CHECK PENDING HIRE
  // ===================================================

  const pending =
    pendingHires.get(
      String(userId)
    );


  // ===================================================
  // CONFIRM HIRE
  // ===================================================

  if (
    pending &&
    isYes(q)
  ) {

    const result =
      await createChatbotJob(

        userId,

        pending.workerId,

        pending.category,

        lat,

        lng

      );


    if (!result.success) {

      return res.json({

        reply:
          result.message

      });

    }


    pendingHires.delete(
      String(userId)
    );


    const worker =
      await User.findById(
        pending.workerId
      );


    return res.json({

      reply:

        `✅ Hire request sent successfully!\n\n` +

        `👷 Worker: ${worker?.name || "Worker"}\n` +

        `🔧 Skill: ${pending.category}\n` +

        `⭐ Rating: ${worker?.rating || 0}/5\n` +

        `💼 Experience: ${worker?.experience || 0} years\n\n` +

        `The request is now pending. The worker can accept it from their dashboard.`

    });

  }


  // ===================================================
  // CANCEL HIRE
  // ===================================================

  if (
    pending &&
    isNo(q)
  ) {

    pendingHires.delete(
      String(userId)
    );


    return res.json({

      reply:
        "No problem 👍 I cancelled the hire request."

    });

  }


  // ===================================================
  // GREETING
  // ===================================================

  if (
    has(q, [

      "hello",
      "hi",
      "hey",
      "good morning",
      "good afternoon",
      "good evening"

    ])
  ) {

    return res.json({

      reply:
        "Hello! 👋 Welcome to the Worker Platform.\n\n" +

        "I can help you find workers, send urgent requests " +

        "and check your jobs."

    });

  }


  // ===================================================
  // THANKS
  // ===================================================

  if (
    has(q, [

      "thank you",
      "thanks",
      "thank u",
      "thankyou"

    ])
  ) {

    return res.json({

      reply:
        "You're welcome! 😊"

    });

  }


  // ===================================================
  // HELP
  // ===================================================

  if (
    has(q, [

      "help",
      "what can you do",
      "features"

    ])
  ) {

    return res.json({

      reply:

        "I can help you with:\n\n" +

        "🔧 Find workers\n" +

        "🚨 Urgent hiring\n" +

        "📋 Job status\n" +

        "📊 Job history\n" +

        "👷 Worker recommendations\n\n" +

        "You can ask naturally, for example:\n" +

        "\"Can someone fix my pipe?\"\n" +

        "\"I need help with wiring\""

    });

  }


  // ===================================================
  // DETECT CATEGORY
  // ===================================================

  const category =
    detectCategory(q);


  console.log(
    "🔥 DETECTED CATEGORY:",
    category
  );


  // ===================================================
  // URGENT HIRING
  // ===================================================

  if (
    category &&
    isUrgent(q)
  ) {

    console.log(
      "🔥 URGENT REQUEST:",
      category
    );


    const ranked =
      await findWorkers(category);


    console.log(
      "🔥 MATCHED WORKERS:",
      ranked.length
    );


    if (!ranked.length) {

      return res.json({

        reply:
          `🚨 I couldn't find an available ${category} worker right now.`

      });

    }


    const best =
      ranked[0];


    pendingHires.set(

      String(userId),

      {

        workerId:
          best.workerId,

        category:
          category

      }

    );


    return res.json({

      reply:

        `🚨 I found the best available ${category} worker!\n\n` +

        `👷 ${best.name}\n` +

        `⭐ Rating: ${best.rating || 0}/5\n` +

        `💼 Experience: ${best.experience || 0} years\n` +

        `✅ Completed Jobs: ${best.completedJobs || 0}\n` +

        `🤖 Match Score: ${best.matchScore || 0}%\n\n` +

        `Send the hire request to this worker?\n\n` +

        `Reply "Yes" or "No".`

    });

  }


  // ===================================================
  // NORMAL WORKER SEARCH
  // ===================================================

  if (category) {

    console.log(
      "🔥 NORMAL WORKER SEARCH:",
      category
    );


    const ranked =
      await findWorkers(category);


    console.log(
      "🔥 MATCHED WORKERS:",
      ranked.length
    );


    if (!ranked.length) {

      return res.json({

        reply:

          `Sorry, I couldn't find an available ${category} worker right now.`

      });

    }


    const workers =
      ranked.slice(0, 3);


    const reply =
      workers.map(

        (worker, i) =>

          `${i + 1}. ${worker.name}\n` +

          `⭐ Rating: ${worker.rating || 0}/5\n` +

          `💼 Experience: ${worker.experience || 0} years\n` +

          `✅ Completed Jobs: ${worker.completedJobs || 0}\n` +

          `🤖 Match: ${worker.matchScore || 0}%`

      ).join("\n\n");


    return res.json({

      reply:

        `🔧 Available ${category} workers:\n\n` +

        `${reply}\n\n` +

        `You can select a worker from the map/list, ` +

        `or say "I urgently need a ${category}".`

    });

  }


  // ===================================================
  // JOB STATUS
  // ===================================================

  if (
    has(q, [

      "job status",
      "request status",
      "my current job",
      "latest job",
      "where is my job",
      "what happened to my request",
      "did the worker accept",
      "has my worker accepted"

    ])
  ) {

    const job =
      await Job.findOne({

        customer:
          userId

      })
        .populate(

          "worker",
          "name email phone"

        )
        .sort({

          createdAt:
            -1

        });


    if (!job) {

      return res.json({

        reply:
          "You don't have any job requests yet."

      });

    }


    const statusMap = {

      pending:
        "Pending ⏳",

      accepted:
        "Accepted 🟢",

      completed:
        "Completed ✅"

    };


    const status =
      statusMap[job.status] ||
      job.status;


    return res.json({

      reply:

        `📋 Latest Job\n\n` +

        `Job: ${job.title}\n` +

        `Category: ${job.category || "Other"}\n` +

        `Status: ${status}\n` +

        `Worker: ${job.worker?.name || "Not assigned"}\n` +

        `Payment: ₹${job.payment || 0}`

    });

  }


  // ===================================================
  // CUSTOMER JOB HISTORY
  // ===================================================

  if (
    has(q, [

      "show my jobs",
      "my jobs",
      "my requests",
      "job history",
      "request history",
      "previous jobs",
      "past jobs"

    ])
  ) {

    const jobs =
      await Job.find({

        customer:
          userId

      })
        .populate(

          "worker",
          "name email phone"

        )
        .sort({

          createdAt:
            -1

        })
        .limit(5);


    if (!jobs.length) {

      return res.json({

        reply:
          "You don't have any jobs yet."

      });

    }


    const reply =
      jobs.map(

        (job, i) =>

          `${i + 1}. ${job.title}\n` +

          `Category: ${job.category || "Other"}\n` +

          `Status: ${job.status}\n` +

          `Worker: ${job.worker?.name || "Not assigned"}`

      ).join("\n\n");


    return res.json({

      reply:

        `📋 Your Recent Jobs\n\n${reply}`

    });

  }


  // ===================================================
  // JOB COUNT
  // ===================================================

  if (
    (
      q.includes("how many") ||
      q.includes("number of") ||
      q.includes("total")
    ) &&
    q.includes("job")
  ) {

    const count =
      await Job.countDocuments({

        customer:
          userId

      });


    return res.json({

      reply:

        `You have created ${count} job request` +

        `${count === 1 ? "" : "s"} so far.`

    });

  }


  // ===================================================
  // HOW TO HIRE
  // ===================================================

  if (
    has(q, [

      "how to hire",
      "hire a worker",
      "hire worker",
      "how can i hire",
      "how do i hire"

    ])
  ) {

    return res.json({

      reply:

        "You have two options:\n\n" +

        "🗺️ Manual: choose a worker from the map/list and click 'Hire Worker'.\n\n" +

        "🚨 Urgent: tell me what type of worker you need. " +

        "For example: \"I urgently need a plumber\"."

    });

  }


  // ===================================================
  // CUSTOMER PROFILE
  // ===================================================

  if (
    has(q, [

      "my profile",
      "my information",
      "about me"

    ])
  ) {

    const customer =
      await User.findById(
        userId
      );


    return res.json({

      reply:

        `👤 Profile\n\n` +

        `Name: ${customer?.name || "Unknown"}\n` +

        `Email: ${customer?.email || "Unknown"}\n` +

        `Phone: ${customer?.phone || "Not provided"}`

    });

  }


  // ===================================================
  // DEFAULT
  // ===================================================

  return res.json({

    reply:

      "I'm here to help! 😊\n\n" +

      "You can ask me naturally, for example:\n\n" +

      "🔧 \"Can someone fix my pipe?\"\n" +

      "⚡ \"I need help with wiring\"\n" +
      "👷 \"Find me a plumber\"\n" +
      "🚨 \"I urgently need an electrician\"\n" +
      "📋 \"What is my job status?\"\n" +
      "📊 \"Show my jobs\"\n" +
      "❓ \"How do I hire a worker?\""

  });

}


// =====================================================
// ADMIN CHATBOT
// =====================================================

async function adminChatbot(
  q,
  res
) {

  // Greeting

  if (
    has(q, [

      "hello",
      "hi",
      "hey"

    ])
  ) {

    return res.json({

      reply:
        "Hello Admin! 👋 I can help you with platform statistics."

    });

  }


  // Worker count

  if (
    q.includes("worker") &&
    has(q, [

      "how many",
      "count",
      "total",
      "number"

    ])
  ) {

    const count =
      await User.countDocuments({

        role:
          "worker"

      });


    return res.json({

      reply:
        `There are ${count} registered workers. 👷`

    });

  }


  // Customer count

  if (
    q.includes("customer") &&
    has(q, [

      "how many",
      "count",
      "total",
      "number"

    ])
  ) {

    const count =
      await User.countDocuments({

        role:
          "customer"

      });


    return res.json({

      reply:
        `There are ${count} registered customers. 👥`

    });

  }


  // Available workers

  if (
    q.includes("available workers")
  ) {

    const count =
      await User.countDocuments({

        role:
          "worker",

        isAvailable:
          true

      });


    return res.json({

      reply:
        `There are ${count} available workers. 🟢`

    });

  }


  // Busy workers

  if (
    q.includes("busy workers")
  ) {

    const count =
      await User.countDocuments({

        role:
          "worker",

        isAvailable:
          false

      });


    return res.json({

      reply:
        `There are ${count} busy workers. 🔴`

    });

  }


  // Total users

  if (
    q.includes("total users")
  ) {

    const workers =
      await User.countDocuments({

        role:
          "worker"

      });


    const customers =
      await User.countDocuments({

        role:
          "customer"

      });


    return res.json({

      reply:

        `📊 Platform Users\n\n` +

        `👷 Workers: ${workers}\n` +

        `👥 Customers: ${customers}\n` +

        `👤 Total: ${workers + customers}`

    });

  }


  return res.json({

    reply:

      "I can help with:\n\n" +

      "• Worker count\n" +

      "• Customer count\n" +

      "• Total users\n" +

      "• Available workers\n" +

      "• Busy workers"

  });

}


// =====================================================
// MAIN CHATBOT CONTROLLER
// =====================================================

exports.chatbot =
  async (req, res) => {

    try {

      const {
        message,
        lat,
        lng
      } = req.body;


      // ------------------------------------------------
      // Validate message
      // ------------------------------------------------

      if (
        !message ||
        !message.trim()
      ) {

        return res.status(400).json({

          message:
            "Please enter a message."

        });

      }


      const q =
        normalize(message);


      const userId =
        req.user.id;


      const role =
        req.user.role;


      console.log(
        "🔥 CHATBOT CALLED"
      );


      console.log(
        "ROLE:",
        role
      );


      console.log(
        "MESSAGE:",
        q
      );


      console.log(
        "LOCATION:",
        lat,
        lng
      );


      // ------------------------------------------------
      // WORKER
      // ------------------------------------------------

      if (
        role === "worker"
      ) {

        return workerChatbot(

          userId,

          q,

          res

        );

      }


      // ------------------------------------------------
      // CUSTOMER
      // ------------------------------------------------

      if (
        role === "customer"
      ) {

        return customerChatbot(

          userId,

          q,

          lat,

          lng,

          res

        );

      }


      // ------------------------------------------------
      // ADMIN
      // ------------------------------------------------

      if (
        role === "admin"
      ) {

        return adminChatbot(

          q,

          res

        );

      }


      return res.status(403).json({

        message:
          "Unsupported user role."

      });

    } catch (error) {

      console.error(
        "🔥 CHATBOT ERROR:",
        error
      );


      return res.status(500).json({

        message:
          "Chatbot error",

        error:
          error.message

      });

    }

  };