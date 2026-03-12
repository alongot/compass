import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';

// Fetches real course data from Supabase for the given major and merges it
// over the hardcoded structure (title, units, description).
export function useMajorRequirements(majorId) {
  const config = MAJOR_CONFIGS[majorId] ?? MAJOR_CONFIGS.econ_ba;
  const [requirements, setRequirements] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setRequirements(null);
    const courseIds = [];
    for (const cat of Object.values(config.requirements)) {
      for (const c of cat.courses || []) courseIds.push(c.id);
    }
    supabase
      .from('courses')
      .select('course_id_clean, title, description, units_fixed, units_variable_low')
      .in('course_id_clean', courseIds)
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message);
          setRequirements(config.requirements);
          return;
        }
        const lookup = {};
        for (const c of data || []) lookup[c.course_id_clean] = c;

        const enriched = {};
        for (const [areaKey, cat] of Object.entries(config.requirements)) {
          enriched[areaKey] = {
            ...cat,
            courses: cat.courses.map(c => {
              const live = lookup[c.id];
              if (!live) return c;
              return {
                ...c,
                name: live.title || c.name,
                units: live.units_fixed || live.units_variable_low || c.units,
                description: live.description || c.description,
              };
            }),
          };
        }
        setRequirements(enriched);
      });
  }, [majorId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { requirements, error };
}
