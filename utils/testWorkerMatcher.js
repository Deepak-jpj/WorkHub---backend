const {
  rankWorkers
} = require("./workerMatcher");


// Fake job for testing

const job = {

  category: "plumber",

  title: "Bathroom pipe repair",

  description:
    "My bathroom pipe is leaking."

};


// Fake workers

const workers = [

  {
    _id: "worker1",

    name: "Ravi",

    email: "ravi@test.com",

    skills: [
      "plumber"
    ],

    rating: 4.8,

    experience: 5,

    completedJobs: 100,

    isAvailable: true,

    distanceKm: 1.2
  },


  {
    _id: "worker2",

    name: "Kumar",

    email: "kumar@test.com",

    skills: [
      "plumber"
    ],

    rating: 4.5,

    experience: 3,

    completedJobs: 40,

    isAvailable: true,

    distanceKm: 2.5
  },


  {
    _id: "worker3",

    name: "Suresh",

    email: "suresh@test.com",

    skills: [
      "electrician"
    ],

    rating: 4.9,

    experience: 6,

    completedJobs: 150,

    isAvailable: true,

    distanceKm: 0.8
  }

];


// Run matching

const results = rankWorkers(
  job,
  workers
);


// Display results

console.log(
  "\n===== AI WORKER RECOMMENDATIONS =====\n"
);


results.forEach((worker, index) => {

  console.log(
    `${index + 1}. ${worker.name}`
  );

  console.log(
    `   Skills: ${worker.skills.join(", ")}`
  );

  console.log(
    `   Distance: ${worker.distanceKm} km`
  );

  console.log(
    `   Rating: ${worker.rating}`
  );

  console.log(
    `   Experience: ${worker.experience} years`
  );

  console.log(
    `   Completed Jobs: ${worker.completedJobs}`
  );

  console.log(
    `   ⭐ AI Match: ${worker.matchScore}%`
  );

  console.log(
    `   Breakdown:`,
    worker.breakdown
  );

  console.log(
    "------------------------------------"
  );

});