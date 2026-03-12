import { useState, useEffect } from 'react';

/**
 * Dynamic import map keyed by CC short_name (must match institutions.short_name in DB).
 * Each entry is a thunk that returns a Promise resolving to the JSON module.
 */
const IGETC_MAP = {
  'sbcc':     () => import('../data/articulations/igetc/sbcc-igetc.json'),
  'smc':      () => import('../data/articulations/igetc/smc-igetc.json'),
  'de-anza':  () => import('../data/articulations/igetc/de-anza-igetc.json'),
  'occ':      () => import('../data/articulations/igetc/occ-igetc.json'),
  'dvc':      () => import('../data/articulations/igetc/dvc-igetc.json'),
  'foothill': () => import('../data/articulations/igetc/foothill-igetc.json'),
  'pcc':      () => import('../data/articulations/igetc/pcc-igetc.json'),
  'ivc':      () => import('../data/articulations/igetc/ivc-igetc.json'),
  'csm':      () => import('../data/articulations/igetc/csm-igetc.json'),
  'laney':    () => import('../data/articulations/igetc/laney-igetc.json'),
};

/**
 * Resolves and returns the IGETC mapping JSON for a given CC institution.
 *
 * @param {string|null|undefined} institutionShortName - CC short_name (e.g. 'sbcc', 'smc', 'de-anza')
 * @returns {{ mappings: Array<{source_course_code: string, igetc_area: string}>, loading: boolean }}
 */
export function useIgetcMappings(institutionShortName) {
  const [mappings, setMappings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!institutionShortName || !IGETC_MAP[institutionShortName]) {
      setMappings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    IGETC_MAP[institutionShortName]()
      .then((mod) => {
        setMappings(mod.default || []);
        setLoading(false);
      })
      .catch(() => {
        setMappings([]);
        setLoading(false);
      });
  }, [institutionShortName]);

  return { mappings, loading };
}
