/**
 * UCSB API Service
 * Documentation: https://developer.ucsb.edu/
 *
 * Available endpoints:
 * - Academic Curriculums v3.0: Classes, courses, finals
 * - Student Academic Programs: Majors/Minors
 */

// For frontend use, calls go through our backend proxy to protect API key
const PROXY_BASE_URL = 'http://localhost:3001/api';

/**
 * Fetch courses for a given quarter and department
 * @param {string} quarter - Quarter code (e.g., "20241" for Winter 2024)
 * @param {string} subjectCode - Department code (e.g., "ECON", "WRIT")
 * @returns {Promise<Array>} Array of course objects
 */
export async function fetchCourses(quarter, subjectCode) {
  const params = new URLSearchParams({ quarter, subjectCode });
  const response = await fetch(`${PROXY_BASE_URL}/courses?${params}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch details for a specific course
 * @param {string} quarter - Quarter code
 * @param {string} courseId - Course ID (e.g., "ECON 1")
 * @returns {Promise<Object>} Course details
 */
export async function fetchCourseDetails(quarter, courseId) {
  const params = new URLSearchParams({ quarter, courseId });
  const response = await fetch(`${PROXY_BASE_URL}/course?${params}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Fetch all departments/subject areas
 * @returns {Promise<Array>} Array of department objects
 */
export async function fetchDepartments() {
  const response = await fetch(`${PROXY_BASE_URL}/departments`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search courses by keyword
 * @param {string} quarter - Quarter code
 * @param {string} query - Search query
 * @returns {Promise<Array>} Matching courses
 */
export async function searchCourses(quarter, query) {
  const params = new URLSearchParams({ quarter, query });
  const response = await fetch(`${PROXY_BASE_URL}/search?${params}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}
