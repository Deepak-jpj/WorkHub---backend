// =====================================================
// AI WORKER MATCHING ENGINE
// =====================================================
//
// This module calculates a match score for each worker
// based on:
//   1. Skill match       - 40%
//   2. Distance          - 20%
//   3. Rating            - 15%
//   4. Experience        - 10%
//   5. Completed jobs    - 10%
//   6. Availability      - 5%
//
// Total = 100%
//
// =====================================================


// -----------------------------------------------------
// Calculate skill match
// -----------------------------------------------------

function calculateSkillScore(jobCategory, workerSkills = []) {

  if (!jobCategory || !Array.isArray(workerSkills)) {
    return 0;
  }

  const category = jobCategory.toLowerCase().trim();

  const skills = workerSkills.map((skill) =>
    String(skill).toLowerCase().trim()
  );


  // Direct skill match
  if (skills.includes(category)) {
    return 40;
  }


  // Some common variations
  const skillAliases = {

    plumber: [
      "plumbing",
      "pipe repair",
      "bathroom repair"
    ],

    electrician: [
      "electrical",
      "electrical repair",
      "wiring"
    ],

    cleaning: [
      "cleaner",
      "house cleaning",
      "office cleaning"
    ],

    construction: [
      "construction worker",
      "building",
      "masonry"
    ]

  };


  const aliases = skillAliases[category] || [];


  const hasRelatedSkill = skills.some((skill) =>
    aliases.includes(skill)
  );


  if (hasRelatedSkill) {
    return 35;
  }


  return 0;
}


// -----------------------------------------------------
// Calculate distance score
// -----------------------------------------------------

function calculateDistanceScore(distanceKm) {

  if (distanceKm === null || distanceKm === undefined) {
    return 0;
  }


  if (distanceKm <= 1) {
    return 20;
  }

  if (distanceKm <= 2) {
    return 18;
  }

  if (distanceKm <= 3) {
    return 15;
  }

  if (distanceKm <= 4) {
    return 12;
  }

  if (distanceKm <= 5) {
    return 8;
  }


  return 0;
}


// -----------------------------------------------------
// Calculate rating score
// -----------------------------------------------------

function calculateRatingScore(rating = 0) {

  const safeRating = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );


  return (safeRating / 5) * 15;
}


// -----------------------------------------------------
// Calculate experience score
// -----------------------------------------------------

function calculateExperienceScore(experience = 0) {

  const years = Math.max(
    0,
    Number(experience) || 0
  );


  // Maximum 10 points for 5+ years
  return Math.min(years / 5, 1) * 10;
}


// -----------------------------------------------------
// Calculate completed jobs score
// -----------------------------------------------------

function calculateCompletedJobsScore(completedJobs = 0) {

  const jobs = Math.max(
    0,
    Number(completedJobs) || 0
  );


  // Maximum 10 points for 60+ completed jobs
  return Math.min(jobs / 60, 1) * 10;
}


// -----------------------------------------------------
// Calculate availability score
// -----------------------------------------------------

function calculateAvailabilityScore(isAvailable) {

  return isAvailable ? 5 : 0;
}


// -----------------------------------------------------
// Calculate final worker match
// -----------------------------------------------------

function calculateWorkerMatch(job, worker, distanceKm) {

  const skillScore = calculateSkillScore(
    job.category,
    worker.skills
  );


  const distanceScore = calculateDistanceScore(
    distanceKm
  );


  const ratingScore = calculateRatingScore(
    worker.rating
  );


  const experienceScore = calculateExperienceScore(
    worker.experience
  );


  const completedJobsScore = calculateCompletedJobsScore(
    worker.completedJobs
  );


  const availabilityScore = calculateAvailabilityScore(
    worker.isAvailable
  );


  const totalScore =
    skillScore +
    distanceScore +
    ratingScore +
    experienceScore +
    completedJobsScore +
    availabilityScore;


  return {

    workerId: worker._id,

    name: worker.name,

    email: worker.email,

    skills: worker.skills || [],

    rating: worker.rating || 0,

    experience: worker.experience || 0,

    completedJobs: worker.completedJobs || 0,

    isAvailable: worker.isAvailable,

    distanceKm: Number(
      distanceKm.toFixed(2)
    ),

    matchScore: Number(
      totalScore.toFixed(2)
    ),

    breakdown: {

      skill: Number(
        skillScore.toFixed(2)
      ),

      distance: Number(
        distanceScore.toFixed(2)
      ),

      rating: Number(
        ratingScore.toFixed(2)
      ),

      experience: Number(
        experienceScore.toFixed(2)
      ),

      completedJobs: Number(
        completedJobsScore.toFixed(2)
      ),

      availability: Number(
        availabilityScore.toFixed(2)
      )

    }

  };
}


// -----------------------------------------------------
// Rank workers
// -----------------------------------------------------

function rankWorkers(job, workers) {

  const rankedWorkers = workers

    // Only available workers
    .filter((worker) => worker.isAvailable === true)

    .map((worker) => {

      const distanceKm =
        worker.distanceKm !== undefined
          ? Number(worker.distanceKm)
          : 5;

      const match = calculateWorkerMatch(
        job,
        worker,
        distanceKm
      );

      return match;

    })

    // IMPORTANT:
    // Only keep workers whose skill matches the job
    .filter((worker) => worker.breakdown.skill > 0);


  // Highest match first
  rankedWorkers.sort(
    (a, b) => b.matchScore - a.matchScore
  );


  return rankedWorkers;
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------

module.exports = {
  calculateWorkerMatch,
  rankWorkers
};