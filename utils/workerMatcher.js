// =====================================================
// AI WORKER MATCHING ENGINE
// =====================================================
//
// Matching factors:
//   1. Skill match       - 40%
//   2. Distance          - 30%
//   3. Rating            - 10%
//   4. Experience        - 5%
//   5. Completed jobs    - 5%
//   6. Availability      - 10%
//
// Total = 100%
//
// =====================================================


// -----------------------------------------------------
// Calculate skill match (40 points maximum)
// -----------------------------------------------------

function calculateSkillScore(jobCategory, workerSkills = []) {
  if (!jobCategory || !Array.isArray(workerSkills)) {
    return 0;
  }

  const category = String(jobCategory).toLowerCase().trim();

  const skills = workerSkills.map((skill) =>
    String(skill).toLowerCase().trim()
  );

  // Direct skill match
  if (skills.includes(category)) {
    return 40;
  }

  // Common skill variations
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
// Calculate distance score (30 points maximum)
// Closer workers receive higher scores.
// -----------------------------------------------------



function calculateDistanceScore(distanceKm) {
  const distance = Number(distanceKm);

  if (
    distanceKm === null ||
    distanceKm === undefined ||
    !Number.isFinite(distance) ||
    distance < 0
  ) {
    return 0;
  }

  if (distance <= 1) {
    return 30;
  }

  if (distance <= 2) {
    return 27;
  }

  if (distance <= 5) {
    return 24;
  }

  if (distance <= 10) {
    return 20;
  }

  if (distance <= 15) {
    return 16;
  }

  if (distance <= 25) {
    return 12;
  }

  if (distance <= 50) {
    return 6;
  }

  // Workers more than 50 km away receive no distance points.
  return 0;
}


// -----------------------------------------------------
// Calculate rating score (10 points maximum)
// -----------------------------------------------------

function calculateRatingScore(rating = 0) {
  const safeRating = Math.max(
    0,
    Math.min(5, Number(rating) || 0)
  );

  return (safeRating / 5) * 10;
}


// -----------------------------------------------------
// Calculate experience score (5 points maximum)
// -----------------------------------------------------

function calculateExperienceScore(experience = 0) {
  const years = Math.max(
    0,
    Number(experience) || 0
  );

  // Maximum points for 5 or more years of experience.
  return Math.min(years / 5, 1) * 5;
}


// -----------------------------------------------------
// Calculate completed jobs score (5 points maximum)
// -----------------------------------------------------

function calculateCompletedJobsScore(completedJobs = 0) {
  const jobs = Math.max(
    0,
    Number(completedJobs) || 0
  );

  // Maximum points for 60 or more completed jobs.
  return Math.min(jobs / 60, 1) * 5;
}


// -----------------------------------------------------
// Calculate availability score (10 points maximum)
// -----------------------------------------------------

function calculateAvailabilityScore(isAvailable) {
  return isAvailable === true ? 10 : 0;
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

  // Maximum possible score = 100
  const totalScore =
    skillScore +
    distanceScore +
    ratingScore +
    experienceScore +
    completedJobsScore +
    availabilityScore;

  const safeDistance = Number(distanceKm);

  return {
    workerId: worker._id,

    name: worker.name,

    email: worker.email,

    skills: worker.skills || [],

    rating: Number(worker.rating) || 0,

    experience: Number(worker.experience) || 0,

    completedJobs: Number(worker.completedJobs) || 0,

    isAvailable: worker.isAvailable,

    distanceKm:
      Number.isFinite(safeDistance) && safeDistance >= 0
        ? Number(safeDistance.toFixed(2))
        : null,

    // Overall AI match percentage
    matchScore: Number(
      Math.min(100, totalScore).toFixed(2)
    ),

    // Individual contribution of each factor
    breakdown: {
      skill: Number(skillScore.toFixed(2)),

      distance: Number(distanceScore.toFixed(2)),

      rating: Number(ratingScore.toFixed(2)),

      experience: Number(experienceScore.toFixed(2)),

      completedJobs: Number(completedJobsScore.toFixed(2)),

      availability: Number(availabilityScore.toFixed(2))
    }
  };
}


// -----------------------------------------------------
// Rank workers
// -----------------------------------------------------

function rankWorkers(job, workers) {
  const rankedWorkers = workers

    // Consider only available workers.
    .filter((worker) => worker.isAvailable === true)

    .map((worker) => {
      // IMPORTANT:
      // Use the actual distance supplied by the existing
      // worker-location calculation.
      //
      // If distance is missing, use null instead of
      // assuming the worker is only 5 km away.

      const distanceKm =
        worker.distanceKm !== undefined &&
        worker.distanceKm !== null
          ? Number(worker.distanceKm)
          : null;

      return calculateWorkerMatch(
        job,
        worker,
        distanceKm
      );
    })

    // Keep only workers with a matching skill.
    .filter((worker) => worker.breakdown.skill > 0);

  // Highest match score first.
  // When scores are equal, prefer the closer worker.
  rankedWorkers.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }

    return (
      (a.distanceKm ?? Infinity) -
      (b.distanceKm ?? Infinity)
    );
  });

  return rankedWorkers;
}


// -----------------------------------------------------
// EXPORT
// -----------------------------------------------------

module.exports = {
  calculateWorkerMatch,
  rankWorkers
};