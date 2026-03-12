/**
 * Database Hooks for Compass
 *
 * React hooks for querying courses, programs, and requirements from Supabase.
 * These hooks provide data fetching with loading and error states.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../lib/supabase';

/**
 * Hook to fetch courses with optional filters
 * @param {Object} options - Query options
 * @param {string} options.deptCode - Filter by department code
 * @param {string} options.college - Filter by college
 * @param {string} options.search - Search in title/description
 * @param {number} options.limit - Maximum results (default 50)
 * @returns {Object} { courses, loading, error, refetch }
 */
export function useCourses(options = {}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('courses')
        .select('*')
        .order('course_id_clean');

      if (options.deptCode) {
        query = query.eq('dept_code', options.deptCode);
      }

      if (options.college) {
        query = query.eq('college', options.college);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      } else {
        query = query.limit(50);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setCourses(data || []);
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [options.deptCode, options.college, options.search, options.limit]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return { courses, loading, error, refetch: fetchCourses };
}

/**
 * Hook to fetch a single course by ID
 * @param {string} courseIdClean - The course ID (e.g., "CMPSC 16")
 * @returns {Object} { course, loading, error }
 */
export function useCourse(courseIdClean) {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseIdClean) {
      setCourse(null);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    async function fetchCourse() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('courses')
          .select(`
            *,
            course_ge_areas (ge_code, ge_college),
            course_prerequisites (
              prereq_group,
              min_grade,
              can_be_concurrent,
              condition_type,
              condition_value,
              required_course:courses!course_prerequisites_required_course_id_fkey (
                course_id_clean,
                title
              )
            )
          `)
          .eq('course_id_clean', courseIdClean)
          .single();

        if (queryError) throw queryError;
        setCourse(data);
      } catch (err) {
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseIdClean]);

  return { course, loading, error };
}

/**
 * Hook to fetch programs with optional filters
 * @param {Object} options - Query options
 * @param {string} options.type - Filter by program type (e.g., "Bachelor's Degree", "Minor")
 * @param {string} options.level - Filter by level ("Undergraduate", "Graduate")
 * @param {string} options.search - Search in program name
 * @returns {Object} { programs, loading, error, refetch }
 */
export function usePrograms(options = {}) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrograms = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('programs')
        .select('*')
        .eq('status', 'Active')
        .order('name');

      if (options.type) {
        query = query.eq('type', options.type);
      }

      if (options.level) {
        query = query.eq('level', options.level);
      }

      if (options.search) {
        query = query.ilike('name', `%${options.search}%`);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;
      setPrograms(data || []);
    } catch (err) {
      setError(handleSupabaseError(err));
    } finally {
      setLoading(false);
    }
  }, [options.type, options.level, options.search]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  return { programs, loading, error, refetch: fetchPrograms };
}

/**
 * Hook to fetch a program with its requirements
 * @param {string} programGroupId - The program group ID (e.g., "BSACTSC")
 * @returns {Object} { program, categories, loading, error }
 */
export function useProgram(programGroupId) {
  const [program, setProgram] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!programGroupId) {
      setProgram(null);
      setCategories([]);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    async function fetchProgram() {
      setLoading(true);
      setError(null);

      try {
        // Fetch program
        const { data: programData, error: programError } = await supabase
          .from('programs')
          .select('*')
          .eq('program_group_id', programGroupId)
          .eq('status', 'Active')
          .order('effective_start_date', { ascending: false })
          .limit(1)
          .single();

        if (programError) throw programError;
        setProgram(programData);

        // Fetch requirement categories with rules
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('requirement_categories')
          .select(`
            *,
            requirement_rules (
              *,
              course:courses (
                course_id_clean,
                title,
                units_fixed
              )
            )
          `)
          .eq('program_id', programData.id)
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      } catch (err) {
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchProgram();
  }, [programGroupId]);

  return { program, categories, loading, error };
}

/**
 * Hook to fetch prerequisite chain for a course (recursive)
 * Uses PostgreSQL recursive CTE via RPC function
 * @param {string} courseIdClean - The course ID
 * @returns {Object} { prerequisites, loading, error }
 */
export function usePrerequisiteChain(courseIdClean) {
  const [prerequisites, setPrerequisites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseIdClean) {
      setPrerequisites([]);
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    async function fetchPrereqs() {
      setLoading(true);
      setError(null);

      try {
        // For now, just get direct prerequisites
        // TODO: Create RPC function for recursive prerequisite chain
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('course_id_clean', courseIdClean)
          .single();

        if (courseError) throw courseError;

        const { data, error: queryError } = await supabase
          .from('course_prerequisites')
          .select(`
            prereq_group,
            min_grade,
            can_be_concurrent,
            condition_type,
            condition_value,
            required_course:courses!course_prerequisites_required_course_id_fkey (
              course_id_clean,
              title,
              dept_code
            )
          `)
          .eq('course_id', courseData.id)
          .order('prereq_group');

        if (queryError) throw queryError;
        setPrerequisites(data || []);
      } catch (err) {
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchPrereqs();
  }, [courseIdClean]);

  return { prerequisites, loading, error };
}

/**
 * Hook to fetch unique department codes
 * @returns {Object} { departments, loading, error }
 */
export function useDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError('Supabase not configured');
      setLoading(false);
      return;
    }

    async function fetchDepartments() {
      setLoading(true);
      setError(null);

      try {
        const { data, error: queryError } = await supabase
          .from('courses')
          .select('dept_code')
          .order('dept_code');

        if (queryError) throw queryError;

        // Get unique departments
        const uniqueDepts = [...new Set(data.map(c => c.dept_code?.trim()))].filter(Boolean);
        setDepartments(uniqueDepts);
      } catch (err) {
        setError(handleSupabaseError(err));
      } finally {
        setLoading(false);
      }
    }

    fetchDepartments();
  }, []);

  return { departments, loading, error };
}

export default {
  useCourses,
  useCourse,
  usePrograms,
  useProgram,
  usePrerequisiteChain,
  useDepartments,
};
