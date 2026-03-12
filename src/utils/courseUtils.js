import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';

// Extracts a normalized "DEPT NUMBER" course ID from a course string.
// e.g. "CMPSC 16 - Problem Solving..." -> "CMPSC 16"
export function extractCourseId(courseString) {
  const match = courseString.match(/^([A-Z]+(?:\s[A-Z]+)*)\s+(\d+[A-Z]*)/);
  return match ? `${match[1]} ${match[2]}` : courseString;
}

// Builds a flat list of known courses from requirements + quarter plan (for autocomplete).
export function buildKnownCourses(requirements, quarterPlan) {
  if (!requirements) return [];
  const courses = [];
  const seen = new Set();

  for (const [areaKey, cat] of Object.entries(requirements)) {
    for (const c of cat.courses || []) {
      seen.add(c.id);
      courses.push({
        id: c.id,
        name: c.name,
        units: c.units,
        difficulty: c.difficulty,
        description: c.description,
        department: c.id.split(' ')[0],
        areaKey,
        areaName: cat.name,
      });
    }
  }

  for (const q of (quarterPlan || [])) {
    for (const c of q.courses || []) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        courses.push({
          id: c.id,
          name: c.name,
          units: c.units || 4,
          difficulty: c.difficulty,
          description: c.description,
          department: c.id.split(' ')[0],
          areaKey: 'general',
          areaName: 'General Education',
        });
      }
    }
  }

  return courses;
}

// Maps a user object to a MAJOR_CONFIGS key (falls back to econ_ba).
export function getMajorId(user) {
  if (user?.majorId) return user.majorId;
  if (!user?.major) return 'econ_ba';
  const entry = Object.entries(MAJOR_CONFIGS).find(([, cfg]) => cfg.name === user.major);
  return entry?.[0] ?? 'econ_ba';
}
