require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// =====================================================
// CONFIGURATION
// =====================================================

const TOTAL_WORKERS = 200;

// =====================================================
// REALISTIC DEMO NAMES
// Fictional/demo data only
// =====================================================

const firstNames = [
  "Arjun",
  "Ravi",
  "Manoj",
  "Suresh",
  "Kiran",
  "Mahesh",
  "Vinod",
  "Rajesh",
  "Prakash",
  "Naveen",
  "Harish",
  "Ramesh",
  "Ganesh",
  "Vijay",
  "Karthik",
  "Rohit",
  "Akash",
  "Darshan",
  "Shashank",
  "Dhanush",
  "Abhishek",
  "Anil",
  "Sunil",
  "Mohan",
  "Lokesh",
  "Sachin",
  "Santosh",
  "Manjunath",
  "Yash",
  "Suraj",
  "Chetan",
  "Pavan",
  "Shivu",
  "Deepak",
  "Nikhil",
  "Vivek",
  "Ajay",
  "Nithin",
  "Girish",
  "Sanjay"
];

const lastNames = [
  "Kumar",
  "Gowda",
  "Shetty",
  "Rao",
  "Reddy",
  "Patil",
  "Sharma",
  "Naik",
  "Hegde",
  "Bhat",
  "Kulkarni",
  "Joshi",
  "Desai",
  "Poojary",
  "Acharya",
  "Murthy",
  "Nayak",
  "Shah",
  "Verma",
  "Mallya"
];

// =====================================================
// WORK TYPES
// =====================================================

const jobs = [
  {
    skill: "Electrician",
    descriptions: [
      "House wiring and electrical repair",
      "Switchboard installation and repair",
      "Electrical fault detection and maintenance",
      "Fan, light and appliance installation"
    ]
  },

  {
    skill: "Plumber",
    descriptions: [
      "Residential plumbing and pipe repair",
      "Bathroom and kitchen plumbing",
      "Water leakage detection and repair",
      "Tap, pipe and drainage maintenance"
    ]
  },

  {
    skill: "Carpenter",
    descriptions: [
      "Furniture repair and installation",
      "Door and window repair",
      "Custom wooden furniture work",
      "Cupboard and kitchen woodwork"
    ]
  },

  {
    skill: "Painter",
    descriptions: [
      "Interior and exterior wall painting",
      "House painting and wall finishing",
      "Texture painting and colour work",
      "Commercial and residential painting"
    ]
  },

  {
    skill: "AC Technician",
    descriptions: [
      "AC installation and servicing",
      "Air conditioner cleaning and maintenance",
      "AC gas checking and repair",
      "Split and window AC service"
    ]
  },

  {
    skill: "Mechanic",
    descriptions: [
      "Two-wheeler repair and servicing",
      "Vehicle maintenance and troubleshooting",
      "Engine and brake inspection",
      "Bike servicing and repair"
    ]
  },

  {
    skill: "Appliance Repair",
    descriptions: [
      "Washing machine repair",
      "Refrigerator service and repair",
      "Home appliance troubleshooting",
      "Electrical appliance maintenance"
    ]
  },

  {
    skill: "Mason",
    descriptions: [
      "Brickwork and wall construction",
      "House renovation and masonry",
      "Flooring and tile preparation",
      "Concrete and repair work"
    ]
  },

  {
    skill: "Welder",
    descriptions: [
      "Metal welding and fabrication",
      "Gate and grill fabrication",
      "Steel repair and welding",
      "Custom metal fabrication"
    ]
  },

  {
    skill: "Cleaner",
    descriptions: [
      "Residential deep cleaning",
      "Kitchen and bathroom cleaning",
      "Move-in and move-out cleaning",
      "Office and commercial cleaning"
    ]
  },

  {
    skill: "Tailor",
    descriptions: [
      "Clothing alteration and stitching",
      "Custom dress stitching",
      "Men's and women's clothing alterations",
      "Curtain and fabric stitching"
    ]
  },

  {
    skill: "Technician",
    descriptions: [
      "General home maintenance",
      "Equipment installation and repair",
      "Basic electrical and mechanical work",
      "Residential maintenance service"
    ]
  }
];

// =====================================================
// LOCATIONS
// =====================================================
// Each city contains multiple areas and coordinates.
// Coordinates are approximate public geographic points,
// not private addresses.
// =====================================================

const locations = [

  // ---------------------------------------------------
  // BENGALURU - 100 WORKERS
  // ---------------------------------------------------

  {
    city: "Bengaluru",
    area: "Yelahanka",
    lat: 13.1007,
    lng: 77.5963,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Whitefield",
    lat: 12.9698,
    lng: 77.7500,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Electronic City",
    lat: 12.8452,
    lng: 77.6602,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Rajajinagar",
    lat: 12.9910,
    lng: 77.5540,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Jayanagar",
    lat: 12.9250,
    lng: 77.5938,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Banashankari",
    lat: 12.9255,
    lng: 77.5468,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Hebbal",
    lat: 13.0358,
    lng: 77.5970,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Marathahalli",
    lat: 12.9591,
    lng: 77.6974,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Kengeri",
    lat: 12.9177,
    lng: 77.4838,
    count: 10
  },

  {
    city: "Bengaluru",
    area: "Malleshwaram",
    lat: 13.0035,
    lng: 77.5700,
    count: 10
  },

  // ---------------------------------------------------
  // MYSURU - 20
  // ---------------------------------------------------

  {
    city: "Mysuru",
    area: "Vijayanagar",
    lat: 12.3280,
    lng: 76.6080,
    count: 5
  },

  {
    city: "Mysuru",
    area: "Kuvempunagar",
    lat: 12.2790,
    lng: 76.6210,
    count: 5
  },

  {
    city: "Mysuru",
    area: "Hebbal",
    lat: 12.3460,
    lng: 76.6410,
    count: 5
  },

  {
    city: "Mysuru",
    area: "Jayalakshmipuram",
    lat: 12.3200,
    lng: 76.6260,
    count: 5
  },

  // ---------------------------------------------------
  // MANGALURU - 15
  // ---------------------------------------------------

  {
    city: "Mangaluru",
    area: "Kadri",
    lat: 12.8840,
    lng: 74.8430,
    count: 5
  },

  {
    city: "Mangaluru",
    area: "Bejai",
    lat: 12.9000,
    lng: 74.8500,
    count: 5
  },

  {
    city: "Mangaluru",
    area: "Kankanady",
    lat: 12.8680,
    lng: 74.8550,
    count: 5
  },

  // ---------------------------------------------------
  // HUBBALLI - 12
  // ---------------------------------------------------

  {
    city: "Hubballi",
    area: "Vidyanagar",
    lat: 15.3647,
    lng: 75.1240,
    count: 4
  },

  {
    city: "Hubballi",
    area: "Gokul Road",
    lat: 15.3500,
    lng: 75.1450,
    count: 4
  },

  {
    city: "Hubballi",
    area: "Keshwapur",
    lat: 15.3600,
    lng: 75.1300,
    count: 4
  },

  // ---------------------------------------------------
  // BELAGAVI - 10
  // ---------------------------------------------------

  {
    city: "Belagavi",
    area: "Tilakwadi",
    lat: 15.8497,
    lng: 74.4977,
    count: 5
  },

  {
    city: "Belagavi",
    area: "Shahapur",
    lat: 15.8500,
    lng: 74.5200,
    count: 5
  },

  // ---------------------------------------------------
  // SHIVAMOGGA - 8
  // ---------------------------------------------------

  {
    city: "Shivamogga",
    area: "Vinoba Nagar",
    lat: 13.9299,
    lng: 75.5681,
    count: 4
  },

  {
    city: "Shivamogga",
    area: "Gopalagowda Extension",
    lat: 13.9400,
    lng: 75.5600,
    count: 4
  },

  // ---------------------------------------------------
  // TUMAKURU - 8
  // ---------------------------------------------------

  {
    city: "Tumakuru",
    area: "Sira Road",
    lat: 13.3400,
    lng: 77.1000,
    count: 4
  },

  {
    city: "Tumakuru",
    area: "SS Puram",
    lat: 13.3300,
    lng: 77.1100,
    count: 4
  },

  // ---------------------------------------------------
  // DAVANAGERE - 7
  // ---------------------------------------------------

  {
    city: "Davanagere",
    area: "Vidyanagar",
    lat: 14.4644,
    lng: 75.9218,
    count: 2
  },

  {
    city: "Davanagere",
    area: "PJ Extension",
    lat: 14.4700,
    lng: 75.9300,
    count: 2
  },

  // ---------------------------------------------------
  // HASSAN - 5
  // ---------------------------------------------------

  {
    city: "Hassan",
    area: "Vijayanagar",
    lat: 13.0068,
    lng: 76.1004,
    count: 3
  },

  {
    city: "Hassan",
    area: "Salagame Road",
    lat: 13.0000,
    lng: 76.0900,
    count: 2
  },

  // ---------------------------------------------------
  // UDUPI - 5
  // ---------------------------------------------------

  {
    city: "Udupi",
    area: "Manipal",
    lat: 13.3520,
    lng: 74.7920,
    count: 3
  },

  {
    city: "Udupi",
    area: "Kinnimulki",
    lat: 13.3400,
    lng: 74.7500,
    count: 2
  },

  // ---------------------------------------------------
  // CHIKKAMAGALURU - 4
  // ---------------------------------------------------

  {
    city: "Chikkamagaluru",
    area: "Vijayapura",
    lat: 13.3161,
    lng: 75.7720,
    count: 2
  },

  {
    city: "Chikkamagaluru",
    area: "Aldur Road",
    lat: 13.3100,
    lng: 75.7800,
    count: 2
  },

  // ---------------------------------------------------
  // BALLARI - 3
  // ---------------------------------------------------

  {
    city: "Ballari",
    area: "Gandhinagar",
    lat: 15.1394,
    lng: 76.9214,
    count: 3
  },

  // ---------------------------------------------------
  // KALABURAGI - 3
  // ---------------------------------------------------

  {
    city: "Kalaburagi",
    area: "Sedam Road",
    lat: 17.3297,
    lng: 76.8343,
    count: 3
  },

  // ---------------------------------------------------
  // VIJAYAPURA - 3
  // ---------------------------------------------------

  {
    city: "Vijayapura",
    area: "Athani Road",
    lat: 16.8302,
    lng: 75.7100,
    count: 3
  }
];

// =====================================================
// HELPERS
// =====================================================

function randomItem(array) {
  return array[
    Math.floor(
      Math.random() * array.length
    )
  ];
}

function randomNumber(min, max) {
  return Math.floor(
    Math.random() * (max - min + 1)
  ) + min;
}

function randomDecimal(min, max, decimals = 1) {
  const value =
    Math.random() * (max - min) + min;

  return Number(
    value.toFixed(decimals)
  );
}

// =====================================================
// CREATE UNIQUE NAME
// =====================================================

function generateName(index) {
  const first =
    firstNames[
      index % firstNames.length
    ];

  const last =
    lastNames[
      Math.floor(index / firstNames.length) %
        lastNames.length
    ];

  return `${first} ${last}`;
}

// =====================================================
// CREATE UNIQUE DEMO EMAIL
// =====================================================
//
// These are demo identities.
// They are Gmail-format addresses, but should not be
// treated as real email accounts unless you control them.
// =====================================================

function generateEmail(name, index) {
  const cleanName =
    name
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  return `${cleanName}demo${String(
    index + 1
  ).padStart(3, "0")}@gmail.com`;
}

// =====================================================
// CREATE DEMO PHONE
// =====================================================
//
// Clearly marked demo/test-style numbers.
// They are NOT used for SMS OTP.
// =====================================================

function generatePhone(index) {
  return `90000${String(
    index + 1
  ).padStart(5, "0")}`;
}

// =====================================================
// BUILD LOCATION LIST
// =====================================================

function buildLocationList() {
  const list = [];

  for (const location of locations) {
    for (
      let i = 0;
      i < location.count;
      i++
    ) {
      list.push(location);
    }
  }

  return list;
}

// =====================================================
// SEED WORKERS
// =====================================================

async function seedWorkers() {
  try {

    // -------------------------------------------------
    // CHECK MONGO URI
    // -------------------------------------------------

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing in .env"
      );
    }

    // -------------------------------------------------
    // CONNECT DATABASE
    // -------------------------------------------------

    console.log(
      "\nConnecting to MongoDB..."
    );

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected successfully.\n"
    );

    // -------------------------------------------------
    // BUILD LOCATION LIST
    // -------------------------------------------------

    const locationList =
      buildLocationList();

    if (
      locationList.length !==
      TOTAL_WORKERS
    ) {
      throw new Error(
        `Location count is ${locationList.length}, but expected ${TOTAL_WORKERS}.`
      );
    }

    // -------------------------------------------------
    // CHECK EXISTING DEMO WORKERS
    // -------------------------------------------------

    const existingDemoWorkers =
      await User.countDocuments({
        role: "worker",
        email: {
          $regex:
            /demo\d{3}@gmail\.com$/i
        }
      });

    if (
      existingDemoWorkers > 0
    ) {
      console.log(
        `Found ${existingDemoWorkers} existing demo workers.`
      );

      console.log(
        "No new workers will be inserted to avoid duplicates."
      );

      await mongoose.disconnect();

      return;
    }

    // -------------------------------------------------
    // CREATE WORKER DOCUMENTS
    // -------------------------------------------------

    const workers = [];
    const credentialList = [];

    console.log(
      `Creating ${TOTAL_WORKERS} demo workers...\n`
    );

    for (
      let i = 0;
      i < TOTAL_WORKERS;
      i++
    ) {

      const name =
        generateName(i);

      const email =
        generateEmail(
          name,
          i
        );

      const password =
        `WorkHub@${1001 + i}`;

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const job =
        randomItem(jobs);

      const location =
        locationList[i];

      // Small coordinate variation so markers
      // don't sit exactly on top of each other.
      const lat =
        randomDecimal(
          location.lat - 0.015,
          location.lat + 0.015,
          6
        );

      const lng =
        randomDecimal(
          location.lng - 0.015,
          location.lng + 0.015,
          6
        );

      const experience =
        randomNumber(
          1,
          15
        );

      const rating =
        randomDecimal(
          4.1,
          4.9,
          1
        );

      const completedJobs =
        randomNumber(
          5,
          180
        );

      const isAvailable =
        Math.random() < 0.8;

      const worker = {
        name,

        email,

        phone:
          generatePhone(i),

        password:
          hashedPassword,

        role: "worker",

        skills: [
          job.skill
        ],

        location: {
          type: "Point",

          coordinates: [
            lng,
            lat
          ]
        },

        isAvailable,

        rating,

        experience,

        completedJobs
      };

      workers.push(
        worker
      );

      credentialList.push({
        no: i + 1,
        name,
        email,
        password,
        skill: job.skill,
        experience,
        city: location.city,
        area: location.area,
        rating,
        isAvailable
      });
    }

    // -------------------------------------------------
    // INSERT ALL WORKERS
    // -------------------------------------------------

    await User.insertMany(
      workers
    );

    console.log(
      `\n✅ ${workers.length} demo workers created successfully!\n`
    );

    // -------------------------------------------------
    // DISPLAY CREDENTIALS
    // -------------------------------------------------

    console.log(
      "====================================================="
    );

    console.log(
      "DEMO WORKER LOGIN CREDENTIALS"
    );

    console.log(
      "=====================================================\n"
    );

    for (
      const worker of credentialList
    ) {

      console.log(
        `${worker.no}. ${worker.name}`
      );

      console.log(
        `   Email: ${worker.email}`
      );

      console.log(
        `   Password: ${worker.password}`
      );

      console.log(
        `   Skill: ${worker.skill}`
      );

      console.log(
        `   Experience: ${worker.experience} years`
      );

      console.log(
        `   Location: ${worker.area}, ${worker.city}`
      );

      console.log(
        `   Rating: ${worker.rating}`
      );

      console.log(
        `   Available: ${worker.isAvailable}`
      );

      console.log(
        "-----------------------------------------------------"
      );
    }

    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------

    await mongoose.disconnect();

    console.log(
      "\nMongoDB disconnected."
    );

    console.log(
      "Demo worker seeding completed."
    );

  } catch (error) {

    console.error(
      "\n❌ SEED ERROR:"
    );

    console.error(
      error.message
    );

    try {
      await mongoose.disconnect();
    } catch (_) {}

    process.exit(1);
  }
}

// =====================================================
// RUN
// =====================================================

seedWorkers();