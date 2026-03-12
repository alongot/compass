import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

/**
 * Fetches all institutions from the `institutions` table.
 * @returns {{ institutions: object[], loading: boolean, error: string|null }}
 */
export function useInstitutions() {
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('institutions')
      .select('id, name, short_name, assist_org_id, city, state')
      .order('name')
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) setError(err.message);
        else setInstitutions(data || []);
      });
  }, []);

  return { institutions, loading, error };
}

/**
 * Fetches articulation rows for a given institution UUID, joining the target
 * UCSB course data from the `courses` table.
 *
 * @param {string|null} institutionId - UUID of the source institution
 * @returns {{ articulations: object[], loading: boolean, error: string|null }}
 */
export function useArticulations(institutionId) {
  const [articulations, setArticulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!institutionId) {
      setArticulations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    supabase
      .from('articulations')
      .select(`
        source_course_code,
        source_course_title,
        source_units,
        articulation_type,
        notes,
        target_course:courses!articulations_target_course_id_fkey (
          course_id_clean,
          title,
          units_fixed
        )
      `)
      .eq('source_institution_id', institutionId)
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) setError(err.message);
        else setArticulations(data || []);
      });
  }, [institutionId]);

  return { articulations, loading, error };
}
