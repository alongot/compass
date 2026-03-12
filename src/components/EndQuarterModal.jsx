import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';

const GRADE_OPTIONS = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

export function EndQuarterModal({
  inProgressCourses = [],
  knownCourses = [],
  completedCourseIds = new Set(),
  onEndQuarter,
  onClose,
}) {
  const [step, setStep] = useState(1);
  const [grades, setGrades] = useState(() =>
    inProgressCourses.reduce((acc, c) => ({ ...acc, [c.id]: 'A' }), {})
  );
  const [selectedNext, setSelectedNext] = useState(new Set());

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Enrollment options: known courses excluding already-completed and currently in-progress
  const inProgressIds = new Set(inProgressCourses.map(c => c.id));
  const enrollmentOptions = knownCourses.filter(
    c => !completedCourseIds.has(c.id) && !inProgressIds.has(c.id)
  );

  const toggleNext = (id) => {
    setSelectedNext(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleEnroll = () => {
    onEndQuarter(grades, Array.from(selectedNext));
    onClose();
  };

  return (
    <div
      data-testid="modal-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: theme.zIndex.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing[4],
      }}
    >
      <div
        data-testid="modal-card"
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          maxWidth: '560px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: theme.shadows.lg,
        }}
      >
        {step === 1 ? (
          <>
            <h2
              style={{
                fontFamily: theme.typography.display,
                fontSize: theme.typography.scale.xl,
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.primary,
                margin: `0 0 ${theme.spacing[2]} 0`,
              }}
            >
              End Quarter
            </h2>
            <p style={{
              color: theme.colors.gray[500],
              marginBottom: theme.spacing[5],
              fontSize: theme.typography.scale.sm,
            }}>
              Enter final grades for your current courses
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[3] }}>
              {inProgressCourses.map(course => (
                <div
                  key={course.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                    backgroundColor: theme.colors.gray[50],
                    borderRadius: theme.radii.md,
                    border: `1px solid ${theme.colors.gray[200]}`,
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: theme.typography.weight.semibold,
                      color: theme.colors.primary,
                      fontSize: theme.typography.scale.sm,
                    }}>
                      {course.id}
                    </div>
                    {course.name && course.name !== course.id && (
                      <div style={{
                        fontSize: theme.typography.scale.xs,
                        color: theme.colors.gray[500],
                      }}>
                        {course.name}
                      </div>
                    )}
                  </div>
                  <select
                    value={grades[course.id] || 'A'}
                    onChange={e => setGrades(prev => ({ ...prev, [course.id]: e.target.value }))}
                    style={{
                      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                      borderRadius: theme.radii.sm,
                      border: `1px solid ${theme.colors.gray[300]}`,
                      fontSize: theme.typography.scale.sm,
                      fontWeight: theme.typography.weight.semibold,
                      color: theme.colors.primary,
                      backgroundColor: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {GRADE_OPTIONS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              style={{
                marginTop: theme.spacing[5],
                width: '100%',
                padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.radii.md,
                fontSize: theme.typography.scale.sm,
                fontWeight: theme.typography.weight.semibold,
                cursor: 'pointer',
              }}
            >
              Confirm Grades
            </button>
          </>
        ) : (
          <>
            <h2
              style={{
                fontFamily: theme.typography.display,
                fontSize: theme.typography.scale.xl,
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.primary,
                margin: `0 0 ${theme.spacing[2]} 0`,
              }}
            >
              Select Upcoming Courses
            </h2>
            <p style={{
              color: theme.colors.gray[500],
              marginBottom: theme.spacing[4],
              fontSize: theme.typography.scale.sm,
            }}>
              Pick courses for the upcoming quarter (optional)
            </p>

            <div style={{
              maxHeight: '320px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing[2],
              marginBottom: theme.spacing[5],
            }}>
              {enrollmentOptions.length === 0 ? (
                <p style={{ color: theme.colors.gray[400], textAlign: 'center', padding: theme.spacing[4] }}>
                  No additional courses available
                </p>
              ) : (
                enrollmentOptions.map(course => (
                  <label
                    key={course.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                      backgroundColor: selectedNext.has(course.id) ? theme.colors.gray[100] : 'white',
                      borderRadius: theme.radii.md,
                      border: `1px solid ${selectedNext.has(course.id) ? theme.colors.primary : theme.colors.gray[200]}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={course.id}
                      checked={selectedNext.has(course.id)}
                      onChange={() => toggleNext(course.id)}
                      style={{ accentColor: theme.colors.primary }}
                    />
                    <div>
                      <div style={{
                        fontWeight: theme.typography.weight.semibold,
                        color: theme.colors.primary,
                        fontSize: theme.typography.scale.sm,
                      }}>
                        {course.id}
                      </div>
                      {course.name && course.name !== course.id && (
                        <div style={{
                          fontSize: theme.typography.scale.xs,
                          color: theme.colors.gray[500],
                        }}>
                          {course.name}
                        </div>
                      )}
                    </div>
                    {course.units && (
                      <span style={{
                        marginLeft: 'auto',
                        fontSize: theme.typography.scale.xs,
                        color: theme.colors.gray[400],
                      }}>
                        {course.units} units
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>

            <button
              onClick={handleEnroll}
              style={{
                width: '100%',
                padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: theme.radii.md,
                fontSize: theme.typography.scale.sm,
                fontWeight: theme.typography.weight.semibold,
                cursor: 'pointer',
                marginBottom: theme.spacing[2],
              }}
            >
              Enroll in Next Quarter
            </button>
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                backgroundColor: 'transparent',
                color: theme.colors.gray[500],
                border: 'none',
                borderRadius: theme.radii.md,
                fontSize: theme.typography.scale.sm,
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}
