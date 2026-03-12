import { useState, useEffect, useCallback } from 'react';
import { fetchCourses, fetchDepartments, searchCourses } from '../utils/ucsbApi.js';

/**
 * Hook for fetching courses from UCSB API
 * @param {string} quarter - Quarter code (e.g., "20241")
 * @param {string} subjectCode - Department code (e.g., "ECON")
 */
export function useCourses(quarter, subjectCode) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!quarter || !subjectCode) return;

    async function loadCourses() {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCourses(quarter, subjectCode);
        setCourses(data.classes || data || []);
      } catch (err) {
        setError(err.message);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
  }, [quarter, subjectCode]);

  return { courses, loading, error };
}

/**
 * Hook for fetching all departments
 */
export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await fetchDepartments();
        setDepartments(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDepartments();
  }, []);

  return { departments, loading, error };
}

/**
 * Hook for searching courses
 * @param {string} quarter - Quarter code
 */
export function useCourseSearch(quarter) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await searchCourses(quarter, query);
      setResults(data.classes || data || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [quarter]);

  return { results, loading, error, search };
}
