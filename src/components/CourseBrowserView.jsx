import React, { useState, useMemo, useEffect } from 'react';

const PAGE_SIZE = 20;
import { theme } from '../styles/theme.js';
import { useDeptCourses } from '../hooks/useDeptCourses.js';
import { getCatalogDescriptions } from '../data/demo/catalogDescriptions.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';
import { buildKnownCourses } from '../utils/courseUtils.js';
import { DifficultyBadge } from './shared/DifficultyBadge.jsx';
import { StatusBadge } from './shared/StatusBadge.jsx';

export const CourseBrowserView = ({ requirements, majorId }) => {
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [areaFilter, setAreaFilter] = useState('all');
  const [difficultySortDir, setDifficultySortDir] = useState('none');
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [areaFilter, difficultySortDir]);

  const config = MAJOR_CONFIGS[majorId] ?? MAJOR_CONFIGS.econ_ba;
  const { courses: supabaseCourses, loading, error } = useDeptCourses(config.browseDeptCodes);
  const mathCourses = []; // no longer needed separately; useDeptCourses covers all depts

  // Assign catalog descriptions at component level
  const catalogDescriptions = getCatalogDescriptions();

  // Build status map from live requirements
  const statusMap = {};
  if (requirements) {
    for (const cat of Object.values(requirements)) {
      for (const c of cat.courses || []) {
        statusMap[c.id] = { status: c.status, grade: c.grade };
      }
    }
  }

  // Build area lookup: course ID → which requirement category it belongs to
  const areaLookup = {};
  if (requirements) {
    for (const [areaKey, cat] of Object.entries(requirements)) {
      for (const c of cat.courses || []) {
        areaLookup[c.id] = { areaKey, areaName: cat.name };
      }
    }
  }

  // Difficulty scores come from hardcoded config data
  const difficultyLookup = {};
  for (const c of buildKnownCourses(config.requirements, config.defaultQuarterPlan)) {
    if (c.difficulty != null) difficultyLookup[c.id] = c.difficulty;
  }

  // Map Supabase records to the display shape
  const mapCourse = (c) => ({
    id: c.course_id_clean,
    name: c.title,
    units: c.units_fixed || c.units_variable_low || 4,
    description: c.description,
    areaKey: areaLookup[c.course_id_clean]?.areaKey || 'other',
    areaName: areaLookup[c.course_id_clean]?.areaName || `Other ${config.browseDeptCodes[0]} Courses`,
    difficulty: difficultyLookup[c.course_id_clean],
  });
  const allCourses = [
    ...supabaseCourses.map(mapCourse),
    ...mathCourses.map(mapCourse),
  ];

  // Filter and sort
  let courses = allCourses.filter(c => {
    if (areaFilter !== 'all' && c.areaKey !== areaFilter) return false;
    return true;
  });

  if (difficultySortDir === 'asc') {
    courses = [...courses].sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
  } else if (difficultySortDir === 'desc') {
    courses = [...courses].sort((a, b) => (b.difficulty || 0) - (a.difficulty || 0));
  }

  const totalPages = Math.ceil(courses.length / PAGE_SIZE);
  const visibleCourses = courses.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const cycleDifficultySort = () => {
    setDifficultySortDir(prev => prev === 'none' ? 'asc' : prev === 'asc' ? 'desc' : 'none');
  };

  const difficultyLabel = difficultySortDir === 'none' ? 'Difficulty' : difficultySortDir === 'asc' ? 'Difficulty \u2191' : 'Difficulty \u2193';

  const statusStyles = {
    completed: { bg: theme.colors.successSurface, color: theme.colors.successText, text: 'Completed', border: theme.colors.successBorder },
    in_progress: { bg: theme.colors.infoSurface, color: theme.colors.infoText, text: 'In Progress', border: theme.colors.infoBorder },
    planned: { bg: theme.colors.warningSurface, color: theme.colors.warningText, text: 'Planned', border: theme.colors.warningBorder },
    not_started: { bg: 'white', color: theme.colors.gray[500], text: 'Not Started', border: theme.colors.gray[300] },
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px', color: theme.colors.gray[400] }}>
        Loading {config.name} courses...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 20px', color: theme.colors.danger }}>
        Error loading courses: {error}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: theme.typography.scale['2xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary, margin: 0, fontFamily: theme.typography.display }}>
          Course Browser
        </h2>
        <p style={{ color: theme.colors.gray[500], margin: '4px 0 0', fontSize: '0.9rem' }}>
          Browse all {allCourses.length} {config.name} courses from the UCSB catalog
        </p>
      </div>

      {/* Filter/Sort Bar */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        <select
          value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: `1px solid ${theme.colors.gray[300]}`,
            fontSize: '0.875rem',
            color: theme.colors.gray[700],
            backgroundColor: 'white',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Areas</option>
          {Object.entries(config.requirements).map(([key, cat]) => (
            <option key={key} value={key}>{cat.name}</option>
          ))}
          <option value="other">Other {config.browseDeptCodes[0]} Courses</option>
        </select>

        <button
          onClick={cycleDifficultySort}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: `1px solid ${difficultySortDir !== 'none' ? theme.colors.primary : theme.colors.gray[300]}`,
            fontSize: '0.875rem',
            color: difficultySortDir !== 'none' ? 'white' : theme.colors.gray[700],
            backgroundColor: difficultySortDir !== 'none' ? theme.colors.primary : 'white',
            cursor: 'pointer',
            fontWeight: difficultySortDir !== 'none' ? '600' : '400',
            transition: 'all 0.15s ease',
          }}
        >
          {difficultyLabel}
        </button>

        <span style={{ fontSize: '0.8rem', color: theme.colors.gray[400], marginLeft: 'auto' }}>
          {courses.length} course{courses.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Course List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleCourses.map(course => {
          const info = statusMap[course.id] || { status: 'not_started' };
          const ss = statusStyles[info.status] || statusStyles.not_started;
          const isExpanded = expandedCourse === course.id;

          return (
            <div key={course.id} style={{
              backgroundColor: 'white',
              borderRadius: theme.radii.lg,
              boxShadow: theme.shadows.sm,
              overflow: 'hidden',
              border: isExpanded ? `2px solid ${theme.colors.primary}` : '2px solid transparent',
              transition: 'border-color 0.15s ease',
            }}>
              {/* Collapsed Row */}
              <div
                onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 20px',
                  cursor: 'pointer',
                  gap: '16px',
                  transition: 'background-color 0.1s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.gray[50]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                <span style={{
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  color: theme.colors.primary,
                  minWidth: '100px',
                }}>
                  {course.id}
                </span>
                <span style={{
                  flex: 1,
                  fontSize: '0.9rem',
                  color: theme.colors.gray[700],
                }}>
                  {course.name}
                </span>
                <span style={{
                  fontSize: '0.8rem',
                  color: theme.colors.gray[500],
                  minWidth: '50px',
                  textAlign: 'center',
                }}>
                  {course.units} units
                </span>
                {course.difficulty && <DifficultyBadge score={course.difficulty} size="small" />}
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.7rem',
                  fontWeight: '600',
                  backgroundColor: ss.bg,
                  color: ss.color,
                  border: `1px solid ${ss.border}`,
                  minWidth: '80px',
                  textAlign: 'center',
                }}>
                  {ss.text}
                </span>
                <span style={{
                  color: theme.colors.gray[400],
                  fontSize: '0.75rem',
                  transition: 'transform 0.15s ease',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                  {'\u25BC'}
                </span>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div style={{
                  padding: '0 20px 16px',
                  borderTop: `1px solid ${theme.colors.gray[100]}`,
                }}>
                  <div style={{ padding: '16px 0 0' }}>
                    {(catalogDescriptions[course.id] || course.description) && (
                      <p style={{
                        color: theme.colors.gray[600],
                        fontSize: '0.875rem',
                        lineHeight: '1.6',
                        margin: '0 0 12px',
                      }}>
                        {catalogDescriptions[course.id] || course.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: theme.colors.gray[100],
                        color: theme.colors.gray[600],
                      }}>
                        {course.areaName}
                      </span>
                      {info.grade && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: theme.colors.infoSurface,
                          color: theme.colors.infoText,
                        }}>
                          Grade: {info.grade}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {courses.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: theme.colors.gray[500],
            backgroundColor: 'white',
            borderRadius: '12px',
          }}>
            No courses match the selected filters.
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.spacing[3],
          marginTop: theme.spacing[5],
          paddingBottom: theme.spacing[4],
        }}>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            style={{
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              background: page === 0 ? theme.colors.gray[100] : 'white',
              color: page === 0 ? theme.colors.gray[400] : theme.colors.primary,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
              fontFamily: theme.typography.body,
              fontSize: theme.typography.scale.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Previous
          </button>
          <span style={{
            fontSize: theme.typography.scale.sm,
            color: theme.colors.gray[600],
            fontFamily: theme.typography.body,
          }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            style={{
              padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
              borderRadius: theme.radii.md,
              border: `1px solid ${theme.colors.border}`,
              background: page === totalPages - 1 ? theme.colors.gray[100] : 'white',
              color: page === totalPages - 1 ? theme.colors.gray[400] : theme.colors.primary,
              cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer',
              fontFamily: theme.typography.body,
              fontSize: theme.typography.scale.sm,
              fontWeight: theme.typography.weight.medium,
            }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
