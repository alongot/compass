import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

// Fetches all courses from the given dept codes (supports trailing-space dept codes via LIKE).
export function useDeptCourses(deptCodes) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const key = JSON.stringify(deptCodes);

  useEffect(() => {
    if (!deptCodes || deptCodes.length === 0) { setLoading(false); return; }
    setLoading(true);
    const orFilter = deptCodes.map(d => `dept_code.like.${d}%`).join(',');
    supabase
      .from('courses')
      .select('course_id_clean, title, description, units_fixed, units_variable_low, dept_code')
      .or(orFilter)
      .limit(500)
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) setError(err.message);
        else setCourses(data || []);
      });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  return { courses, loading, error };
}
