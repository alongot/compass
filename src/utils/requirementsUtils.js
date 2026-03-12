import { extractCourseId } from './courseUtils.js';

// Merges transcript completion data into base requirements, returning an updated copy.
// Each course in the returned requirements will have status: 'completed' | 'in_progress' | 'not_started'.
export function buildUserRequirements(baseRequirements, transcript) {
  if (!transcript) return baseRequirements;

  const completedMap = {};
  const inProgressMap = {};

  (transcript.completed || []).forEach(c => {
    completedMap[extractCourseId(c.course)] = c;
  });
  (transcript.in_progress || []).forEach(c => {
    inProgressMap[extractCourseId(c.course)] = c;
  });

  const updated = structuredClone(baseRequirements);
  for (const category of Object.values(updated)) {
    if (!category.courses) continue;
    category.courses = category.courses.map(course => {
      if (completedMap[course.id]) {
        return { ...course, status: 'completed', grade: completedMap[course.id].grade };
      }
      if (inProgressMap[course.id]) {
        return { ...course, status: 'in_progress', grade: undefined };
      }
      return { ...course, status: 'not_started', grade: undefined };
    });
  }
  return updated;
}

// Builds a quarter plan timeline by removing completed/in-progress courses from
// the default plan and prepending the current quarter's in-progress courses.
export function buildUserQuarterPlan(basePlan, transcript, currentQuarterName, knownCoursesArr) {
  if (!transcript) return basePlan;

  const completedIds = new Set(
    (transcript.completed || []).map(c => extractCourseId(c.course))
  );
  const inProgressIds = new Set(
    (transcript.in_progress || []).map(c => extractCourseId(c.course))
  );

  // Strip completed AND current-quarter courses from the pre-built future plan
  const futurePlan = basePlan.map(quarter => {
    const filteredCourses = quarter.courses.filter(
      c => !completedIds.has(c.id) && !inProgressIds.has(c.id)
    );
    return { ...quarter, courses: filteredCourses, totalUnits: filteredCourses.length * 4 };
  }).filter(q => q.courses.length > 0);

  // Build the live current-quarter entry from in_progress courses
  const inProgressCourses = (transcript.in_progress || []).map(c => {
    const courseId = extractCourseId(c.course);
    const known = (knownCoursesArr || []).find(k => k.id === courseId);
    return {
      id: courseId,
      name: known?.name || c.course,
      difficulty: known?.difficulty || 3.0,
      color: 'yellow',
    };
  });

  if (inProgressCourses.length > 0) {
    return [
      {
        quarter: currentQuarterName || 'Current Quarter',
        status: 'current',
        courses: inProgressCourses,
        totalUnits: inProgressCourses.length * 4,
      },
      ...futurePlan,
    ];
  }

  return futurePlan.length > 0 ? futurePlan : basePlan;
}
