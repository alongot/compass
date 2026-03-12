/**
 * Maps checked CC course codes to UCSB course IDs that are satisfied via articulation.
 * Pure function — no side effects, no React, no Supabase imports.
 *
 * @param {string[]} checkedCcCourses - source_course_code values the student has completed
 * @param {Array}    articulations    - rows from useArticulations() hook
 * @param {Object}   majorRequirements - MAJOR_CONFIGS[majorId].requirements object
 * @returns {string[]} UCSB course IDs (course_id_clean) satisfied by the CC courses
 */
export function mapCcCoursesToUcsbRequirements(checkedCcCourses, articulations, majorRequirements) {
  if (!checkedCcCourses?.length || !articulations?.length) return [];

  // Build a lookup: source_course_code -> target course_id_clean
  const ccToUcsb = {};
  for (const art of articulations) {
    if (art.articulation_type === 'equivalent' && art.target_course?.course_id_clean) {
      ccToUcsb[art.source_course_code] = art.target_course.course_id_clean;
    }
  }

  // Collect all UCSB course IDs present in the major requirements
  const allRequiredCourseIds = new Set();
  if (majorRequirements) {
    for (const area of Object.values(majorRequirements)) {
      for (const c of area.courses || []) {
        allRequiredCourseIds.add(c.id);
      }
    }
  }

  // Map checked CC courses to UCSB IDs, filter to those in requirements
  const satisfied = new Set();
  for (const ccCode of checkedCcCourses) {
    const ucsbId = ccToUcsb[ccCode];
    if (ucsbId) {
      // Include whether or not it's in requirements — caller can filter
      satisfied.add(ucsbId);
    }
  }

  return [...satisfied];
}

/**
 * Calculates which IGETC areas a student has satisfied based on their completed CC courses.
 * Pure function — no side effects, no React, no Supabase imports.
 *
 * @param {string[]} completedCcCourses - source_course_code values the student has completed
 * @param {Array<{source_course_code: string, igetc_area: string}>} igetcMappings - CC-to-IGETC mappings
 * @returns {Set<string>} Set of satisfied IGETC area IDs (e.g. '1A', '2', '5B')
 */
export function calculateIgetcProgress(completedCcCourses, igetcMappings) {
  const satisfiedAreas = new Set();
  if (!completedCcCourses?.length || !igetcMappings?.length) return satisfiedAreas;

  // O(1) lookup for completed courses
  const completedSet = new Set(completedCcCourses);

  for (const mapping of igetcMappings) {
    if (completedSet.has(mapping.source_course_code)) {
      satisfiedAreas.add(mapping.igetc_area);
    }
  }

  return satisfiedAreas;
}
