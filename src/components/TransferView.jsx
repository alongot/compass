import { useState, useMemo } from 'react';
import { theme } from '../styles/theme.js';
import { useInstitutions, useArticulations } from '../hooks/useArticulations.js';
import { mapCcCoursesToUcsbRequirements } from '../utils/transferUtils.js';

export function TransferView({ majorRequirements }) {
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(null);
  const [checkedCourses, setCheckedCourses] = useState(new Set());

  const { institutions, loading: instLoading } = useInstitutions();
  const { articulations, loading: artLoading } = useArticulations(selectedInstitutionId);

  const satisfiedRequirements = useMemo(
    () => mapCcCoursesToUcsbRequirements([...checkedCourses], articulations, majorRequirements),
    [checkedCourses, articulations, majorRequirements]
  );

  function toggleCourse(courseCode) {
    setCheckedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseCode)) next.delete(courseCode);
      else next.add(courseCode);
      return next;
    });
  }

  function handleInstitutionChange(e) {
    setSelectedInstitutionId(e.target.value || null);
    setCheckedCourses(new Set());
  }

  return (
    <div className="transfer-view" style={{ padding: '1.5rem' }}>
      <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Transfer Credits</h2>
      <p style={{ color: theme.colors.gray[500], marginBottom: '1.5rem' }}>
        Select your community college to see which courses satisfy UCSB requirements.
      </p>

      {/* CC Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label htmlFor="cc-select" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
          Community College
        </label>
        {instLoading ? (
          <p>Loading institutions...</p>
        ) : (
          <select
            id="cc-select"
            onChange={handleInstitutionChange}
            value={selectedInstitutionId || ''}
            style={{
              width: '100%',
              maxWidth: '400px',
              padding: '0.5rem 0.75rem',
              border: `1px solid ${theme.colors.gray[300]}`,
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: 'white',
            }}
          >
            <option value="">Select your community college...</option>
            {institutions.map(inst => (
              <option key={inst.id} value={inst.id}>{inst.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Course Checklist */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Completed Courses</h3>
        {!selectedInstitutionId ? (
          <p style={{ color: theme.colors.gray[500] }}>Select a community college above.</p>
        ) : artLoading ? (
          <p>Loading courses...</p>
        ) : articulations.length === 0 ? (
          <p style={{ color: theme.colors.gray[500] }}>No articulation data available for this college.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {articulations.map(art => (
              <label
                key={art.source_course_code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  backgroundColor: checkedCourses.has(art.source_course_code) ? theme.colors.infoSurfaceLight : 'transparent',
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedCourses.has(art.source_course_code)}
                  onChange={() => toggleCourse(art.source_course_code)}
                />
                <span>
                  <strong>{art.source_course_code}</strong>
                  {art.source_course_title && ` — ${art.source_course_title}`}
                  {art.target_course?.course_id_clean && (
                    <span style={{ color: theme.colors.gray[500], marginLeft: '0.5rem' }}>
                      {'\u2192'} UCSB {art.target_course.course_id_clean}
                    </span>
                  )}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div style={{ borderTop: `1px solid ${theme.colors.gray[200]}`, paddingTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Satisfied UCSB Requirements</h3>
        {checkedCourses.size === 0 ? (
          <p style={{ color: theme.colors.gray[500] }}>
            Check courses above to see which UCSB requirements they satisfy.
          </p>
        ) : satisfiedRequirements.length === 0 ? (
          <p style={{ color: theme.colors.gray[500] }}>
            None of the checked courses satisfy requirements for your current major.
          </p>
        ) : (
          <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
            {satisfiedRequirements.map(courseId => (
              <li key={courseId} style={{ marginBottom: '0.25rem' }}>{courseId}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TransferView;
