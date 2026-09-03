require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// =====================================================
// CONFIGURATION
// =====================================================

const TOTAL_NEW_WORKERS = 100;
const START_NUMBER = 201;

// =====================================================
// FICTIONAL DEMO NAMES
// =====================================================

const firstNames = [
  "Amit",
  "Rahul",
  "Vikas",
  "Rohit",
  "Aman",
  "Sanjay",
  "Vivek",
  "Nitin",
  "Pankaj",
  "Varun",
  "Aditya",
  "Kunal",
  "Akshay",
  "Rakesh",
  "Sameer",
  "Ankit",
  "Siddharth",
  "Abhishek",
  "Raj",
  "Mohit",
  "Pranav",
  "Shubham",
  "Tarun",
  "Deepak",
  "Manish",
  "Sachin",
  "Harish",
  "Dinesh",
  "Ajay",
  "Surya",
  "Ramesh",
  "Karthik",
  "Aravind",
  "Suresh",
  "Naveen",
  "Gaurav",
  "Ravi",
  "Manoj",
  "Kiran",
  "Mahesh"
];

const lastNames = [
  "Sharma",
  "Verma",
  "Patel",
  "Singh",
  "Kumar",
  "Gupta",
  "Mehta",
  "Reddy",
  "Rao",
  "Nair",
  "Menon",
  "Iyer",
  "Das",
  "Mishra",
  "Jain",
  "Joshi",
  "Yadav",
  "Chauhan",
  "Thakur",
  "Malhotra"
];

// =====================================================
// JOB TYPES
// =====================================================

const jobs = [
  {
    skill: "Electrician",
    descriptions: [
      "House wiring and electrical repair",
      "Electrical installation and maintenance",
      "Switchboard and lighting repair",
      "Fan and appliance installation"
    ]
  },

  {
    skill: "Plumber",
    descriptions: [
      "Residential plumbing and pipe repair",
      "Bathroom and kitchen plumbing",
      "Water leakage detection and repair",
      "Drainage and tap maintenance"
    ]
  },

  {
    skill: "Carpenter",
    descriptions: [
      "Furniture repair and installation",
      "Door and window repair",
      "Custom wooden furniture work",
      "Cupboard and kitchen work"
    ]
  },

  {
    skill: "Painter",
    descriptions: [
      "Interior and exterior painting",
      "Residential wall painting",
      "Commercial painting work",
      "Wall finishing and texture painting"
    ]
  },

  {
    skill: "AC Technician",
    descriptions: [
      "AC installation and servicing",
      "Air conditioner maintenance",
      "AC cleaning and repair",
      "Split and window AC service"
    ]
  },

  {
    skill: "Mechanic",
    descriptions: [
      "Two-wheeler servicing",
      "Vehicle repair and maintenance",
      "Engine and brake inspection",
      "Bike troubleshooting and repair"
    ]
  },

  {
    skill: "Appliance Repair",
    descriptions: [
      "Washing machine repair",
      "Refrigerator servicing",
      "Home appliance troubleshooting",
      "Electrical appliance repair"
    ]
  },

  {
    skill: "Mason",
    descriptions: [
      "Brickwork and construction",
      "House renovation work",
      "Flooring preparation",
      "Concrete and masonry repair"
    ]
  },

  {
    skill: "Welder",
    descriptions: [
      "Metal welding and fabrication",
      "Gate and grill fabrication",
      "Steel repair work",
      "Custom metal fabrication"
    ]
  },

  {
    skill: "Cleaner",
    descriptions: [
      "Residential deep cleaning",
      "Kitchen and bathroom cleaning",
      "Office cleaning",
      "Move-in and move-out cleaning"
    ]
  },

  {
    skill: "Tailor",
    descriptions: [
      "Clothing alteration",
      "Custom dress stitching",
      "Men's and women's tailoring",
      "Curtain and fabric stitching"
    ]
  },

  {
    skill: "Technician",
    descriptions: [
      "General home maintenance",
      "Equipment installation",
      "Basic mechanical repair",
      "Residential maintenance"
    ]
  }
];

// =====================================================
// LOCATIONS - OUTSIDE KARNATAKA
// EXACTLY 100 WORKERS
// =====================================================

const locations = [

  // ---------------------------------------------------
  // TAMIL NADU - 15
  // ---------------------------------------------------

  {
    state: "Tamil Nadu",
    city: "Chennai",
    area: "Anna Nagar",
    lat: 13.0850,
    lng: 80.2101,
    count: 5
  },

  {
    state: "Tamil Nadu",
    city: "Coimbatore",
    area: "RS Puram",
    lat: 11.0104,
    lng: 76.9558,
    count: 4
  },

  {
    state: "Tamil Nadu",
    city: "Madurai",
    area: "Anna Nagar",
    lat: 9.9252,
    lng: 78.1198,
    count: 3
  },

  {
    state: "Tamil Nadu",
    city: "Salem",
    area: "Fairlands",
    lat: 11.6643,
    lng: 78.1460,
    count: 3
  },

  // ---------------------------------------------------
  // KERALA - 12
  // ---------------------------------------------------

  {
    state: "Kerala",
    city: "Kochi",
    area: "Kakkanad",
    lat: 10.0159,
    lng: 76.3419,
    count: 5
  },

  {
    state: "Kerala",
    city: "Thiruvananthapuram",
    area: "Kazhakootam",
    lat: 8.5659,
    lng: 76.8731,
    count: 3
  },

  {
    state: "Kerala",
    city: "Kozhikode",
    area: "Nadakkavu",
    lat: 11.2835,
    lng: 75.7804,
    count: 2
  },

  {
    state: "Kerala",
    city: "Thrissur",
    area: "Ayyanthole",
    lat: 10.5276,
    lng: 76.2144,
    count: 2
  },

  // ---------------------------------------------------
  // MAHARASHTRA - 12
  // ---------------------------------------------------

  {
    state: "Maharashtra",
    city: "Mumbai",
    area: "Andheri",
    lat: 19.1197,
    lng: 72.8468,
    count: 4
  },

  {
    state: "Maharashtra",
    city: "Pune",
    area: "Kothrud",
    lat: 18.5074,
    lng: 73.8077,
    count: 4
  },

  {
    state: "Maharashtra",
    city: "Nagpur",
    area: "Dharampeth",
    lat: 21.1458,
    lng: 79.0882,
    count: 2
  },

  {
    state: "Maharashtra",
    city: "Nashik",
    area: "College Road",
    lat: 20.0059,
    lng: 73.7629,
    count: 2
  },

  // ---------------------------------------------------
  // TELANGANA - 10
  // ---------------------------------------------------

  {
    state: "Telangana",
    city: "Hyderabad",
    area: "Madhapur",
    lat: 17.4483,
    lng: 78.3915,
    count: 5
  },

  {
    state: "Telangana",
    city: "Hyderabad",
    area: "Kukatpally",
    lat: 17.4849,
    lng: 78.4138,
    count: 3
  },

  {
    state: "Telangana",
    city: "Warangal",
    area: "Hanamkonda",
    lat: 18.0000,
    lng: 79.5833,
    count: 2
  },

  // ---------------------------------------------------
  // ANDHRA PRADESH - 10
  // ---------------------------------------------------

  {
    state: "Andhra Pradesh",
    city: "Visakhapatnam",
    area: "MVP Colony",
    lat: 17.7397,
    lng: 83.3156,
    count: 4
  },

  {
    state: "Andhra Pradesh",
    city: "Vijayawada",
    area: "Benz Circle",
    lat: 16.5062,
    lng: 80.6480,
    count: 3
  },

  {
    state: "Andhra Pradesh",
    city: "Tirupati",
    area: "Tiruchanoor Road",
    lat: 13.6288,
    lng: 79.4192,
    count: 3
  },

  // ---------------------------------------------------
  // DELHI - 8
  // ---------------------------------------------------

  {
    state: "Delhi",
    city: "New Delhi",
    area: "Dwarka",
    lat: 28.5921,
    lng: 77.0460,
    count: 3
  },

  {
    state: "Delhi",
    city: "New Delhi",
    area: "Rohini",
    lat: 28.7495,
    lng: 77.0565,
    count: 3
  },

  {
    state: "Delhi",
    city: "New Delhi",
    area: "Saket",
    lat: 28.5245,
    lng: 77.2066,
    count: 2
  },

  // ---------------------------------------------------
  // GUJARAT - 8
  // ---------------------------------------------------

  {
    state: "Gujarat",
    city: "Ahmedabad",
    area: "Satellite",
    lat: 23.0258,
    lng: 72.5091,
    count: 4
  },

  {
    state: "Gujarat",
    city: "Surat",
    area: "Adajan",
    lat: 21.1959,
    lng: 72.7933,
    count: 2
  },

  {
    state: "Gujarat",
    city: "Vadodara",
    area: "Alkapuri",
    lat: 22.3107,
    lng: 73.1723,
    count: 2
  },

  // ---------------------------------------------------
  // RAJASTHAN - 7
  // ---------------------------------------------------

  {
    state: "Rajasthan",
    city: "Jaipur",
    area: "Vaishali Nagar",
    lat: 26.9124,
    lng: 75.7873,
    count: 4
  },

  {
    state: "Rajasthan",
    city: "Udaipur",
    area: "Hiran Magri",
    lat: 24.5854,
    lng: 73.7125,
    count: 3
  },

  // ---------------------------------------------------
  // WEST BENGAL - 6
  // ---------------------------------------------------

  {
    state: "West Bengal",
    city: "Kolkata",
    area: "Salt Lake",
    lat: 22.5804,
    lng: 88.4145,
    count: 3
  },

  {
    state: "West Bengal",
    city: "Kolkata",
    area: "New Town",
    lat: 22.5958,
    lng: 88.4797,
    count: 3
  },

  // ---------------------------------------------------
  // UTTAR PRADESH - 5
  // ---------------------------------------------------

  {
    state: "Uttar Pradesh",
    city: "Lucknow",
    area: "Gomti Nagar",
    lat: 26.8467,
    lng: 81.0014,
    count: 3
  },

  {
    state: "Uttar Pradesh",
    city: "Noida",
    area: "Sector 62",
    lat: 28.6271,
    lng: 77.3649,
    count: 2
  },

  // ---------------------------------------------------
  // ODISHA - 3
  // ---------------------------------------------------

  {
    state: "Odisha",
    city: "Bhubaneswar",
    area: "Saheed Nagar",
    lat: 20.2961,
    lng: 85.8245,
    count: 3
  },

  // ---------------------------------------------------
  // MADHYA PRADESH - 1
  // ---------------------------------------------------

  {
    state: "Madhya Pradesh",
    city: "Indore",
    area: "Vijay Nagar",
    lat: 22.7533,
    lng: 75.8937,
    count: 1
  },

  // ---------------------------------------------------
  // GOA - 1
  // ---------------------------------------------------

  {
    state: "Goa",
    city: "Panaji",
    area: "Miramar",
    lat: 15.4909,
    lng: 73.8278,
    count: 1
  },

  // ---------------------------------------------------
  // BIHAR - 2
  // ---------------------------------------------------

  {
    state: "Bihar",
    city: "Patna",
    area: "Kankarbagh",
    lat: 25.5941,
    lng: 85.1376,
    count: 2
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
      Math.floor(
        index / firstNames.length
      ) % lastNames.length
    ];

  return `${first} ${last}`;
}

// =====================================================
// CREATE UNIQUE DEMO EMAIL
// =====================================================

function generateEmail(name, workerNumber) {

  const cleanName =
    name
      .toLowerCase()
      .replace(/[^a-z]/g, "");

  return `${cleanName}demo${workerNumber}@gmail.com`;
}

// =====================================================
// DEMO PHONE
// =====================================================

function generatePhone(workerNumber) {

  return `90000${String(
    workerNumber
  ).padStart(5, "0")}`;
}

// =====================================================
// BUILD LOCATION LIST
// =====================================================

function buildLocationList() {

  const list = [];

  for (
    const location of locations
  ) {

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
// MAIN SEED FUNCTION
// =====================================================

async function seedIndianWorkers() {

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
    // CONNECT MONGODB
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
    // BUILD LOCATIONS
    // -------------------------------------------------

    const locationList =
      buildLocationList();

    console.log(
      `Prepared ${locationList.length} locations.`
    );

    if (
      locationList.length !==
      TOTAL_NEW_WORKERS
    ) {

      throw new Error(
        `Location count is ${locationList.length}, expected ${TOTAL_NEW_WORKERS}.`
      );
    }

    // -------------------------------------------------
    // CHECK WHETHER THESE WORKERS ALREADY EXIST
    // -------------------------------------------------

    const existingWorkers =
      await User.countDocuments({
        role: "worker",
        email: {
          $regex:
            /demo(20[1-9]|2[1-9][0-9]|300)@gmail\.com$/i
        }
      });

    if (
      existingWorkers > 0
    ) {

      console.log(
        `Found ${existingWorkers} workers from this demo batch.`
      );

      console.log(
        "No additional workers were inserted."
      );

      await mongoose.disconnect();

      return;
    }

    // -------------------------------------------------
    // CREATE WORKERS
    // -------------------------------------------------

    const workers = [];

    const credentials = [];

    console.log(
      `\nCreating ${TOTAL_NEW_WORKERS} additional Indian demo workers...\n`
    );

    for (
      let i = 0;
      i < TOTAL_NEW_WORKERS;
      i++
    ) {

      const workerNumber =
        START_NUMBER + i;

      const name =
        generateName(i);

      const email =
        generateEmail(
          name,
          workerNumber
        );

      const password =
        `WorkHub@${1000 + workerNumber}`;

      // Hash password
      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );

      const job =
        randomItem(jobs);

      const location =
        locationList[i];

      // Slight coordinate variation
      const latitude =
        randomDecimal(
          location.lat - 0.015,
          location.lat + 0.015,
          6
        );

      const longitude =
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
          generatePhone(
            workerNumber
          ),

        password:
          hashedPassword,

        role: "worker",

        skills: [
          job.skill
        ],

        location: {

          type: "Point",

          coordinates: [
            longitude,
            latitude
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

      credentials.push({

        no: workerNumber,

        name,

        email,

        password,

        skill: job.skill,

        experience,

        city: location.city,

        area: location.area,

        state: location.state,

        rating,

        isAvailable
      });
    }

    // -------------------------------------------------
    // INSERT
    // -------------------------------------------------

    await User.insertMany(
      workers
    );

    console.log(
      `\n✅ ${workers.length} additional workers created successfully!\n`
    );

    // -------------------------------------------------
    // DISPLAY CREDENTIALS
    // -------------------------------------------------

    console.log(
      "====================================================="
    );

    console.log(
      "ADDITIONAL DEMO WORKER LOGIN CREDENTIALS"
    );

    console.log(
      "=====================================================\n"
    );

    for (
      const worker of credentials
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
        `   Location: ${worker.area}, ${worker.city}, ${worker.state}`
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
      "Additional worker seeding completed successfully."
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

seedIndianWorkers();