import React, { useMemo, useState, useRef } from 'react';
import { theme } from '../styles/theme.js';
import { ProgressRing } from './shared/ProgressRing.jsx';
import { IGETC_AREAS } from '../data/igetcAreas.js';
import { calculateIgetcProgress, mapCcCoursesToUcsbRequirements } from '../utils/transferUtils.js';
import { useArticulations, useInstitutions } from '../hooks/useArticulations.js';
import { useIgetcMappings } from '../hooks/useIgetcMappings.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';
import { extractCourseId } from '../utils/courseUtils.js';

export const TransferDashboardView = ({
  user,
  onAddCourse,
  onRemoveCourse,
  onEditCourseGrade,
  onAddInProgress,
  onMarkComplete,
  onEndQuarter,
  knownCourses,
  onUserUpdate,
}) => {
  // --- Hooks (all unconditional) ---
  const { articulations } = useArticulations(user?.source_institution_id ?? null);
  const { institutions } = useInstitutions();
  const { mappings: igetcMappings } = useIgetcMappings(
    institutions.find(i => i.id === user?.source_institution_id)?.short_name ?? null
  );

  // Major edit state
  const [editingMajor, setEditingMajor] = useState(false);
  const [pendingMajorId, setPendingMajorId] = useState(user?.target_major_id ?? '');
  const [savingMajor, setSavingMajor] = useState(false);

  // UCSB transition state
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Current-quarter editing state
  const [editingQuarter, setEditingQuarter] = useState(false);
  const [qtrSearch, setQtrSearch] = useState('');
  const [qtrSugIdx, setQtrSugIdx] = useState(-1);
  const [showQtrSug, setShowQtrSug] = useState(false);
  const qtrSearchRef = useRef(null);
  const qtrSugRef = useRef(null);
  const [markCompleteGrades, setMarkCompleteGrades] = useState({});

  // --- Derived data (memoized) ---
  const institution = useMemo(
    () => institutions.find(i => i.id === user?.source_institution_id),
    [institutions, user]
  );

  const completedCcCourses = useMemo(
    () => (user?.transcript?.completed ?? []).map(c => c.course),
    [user]
  );

  const completedUnits = useMemo(
    () => (user?.transcript?.completed ?? []).reduce((sum, c) => sum + (c.units || 0), 0),
    [user]
  );

  const inProgressUnits = useMemo(
    () => (user?.transcript?.in_progress ?? []).reduce((sum, c) => sum + (c.units || 0), 0),
    [user]
  );

  const satisfiedIgetcAreas = useMemo(
    () => calculateIgetcProgress(completedCcCourses, igetcMappings),
    [completedCcCourses, igetcMappings]
  );

  const igetcPercent = IGETC_AREAS.length > 0
    ? Math.round((satisfiedIgetcAreas.size / IGETC_AREAS.length) * 100)
    : 0;

  const majorRequirements = MAJOR_CONFIGS[user?.target_major_id]?.requirements ?? {};

  const satisfiedMajorCourses = useMemo(
    () => new Set(mapCcCoursesToUcsbRequirements(completedCcCourses, articulations, majorRequirements)),
    [completedCcCourses, articulations, majorRequirements]
  );

  const allMajorLowerDivCourses = useMemo(
    () => Object.values(majorRequirements).flatMap(s => s.courses?.map(c => c.id) ?? []),
    [majorRequirements]
  );

  const majorPercent = allMajorLowerDivCourses.length > 0
    ? Math.round((satisfiedMajorCourses.size / allMajorLowerDivCourses.length) * 100)
    : 0;

  const unitTotal = completedUnits + inProgressUnits;
  const unitPercent = Math.min(Math.round((unitTotal / 60) * 100), 100);

  const targetMajorName = MAJOR_CONFIGS[user?.target_major_id]?.name ?? 'Target Major';

  const majorOptions = Object.entries(MAJOR_CONFIGS).map(([id, cfg]) => ({ id, name: cfg.name }));

  const handleMajorSave = async () => {
    if (!pendingMajorId || pendingMajorId === user.target_major_id) {
      setEditingMajor(false);
      return;
    }
    setSavingMajor(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_major_id: pendingMajorId }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUserUpdate?.(updated);
        setEditingMajor(false);
      }
    } finally {
      setSavingMajor(false);
    }
  };

  const handleUcsbTransition = async () => {
    if (!user?.target_major_id || !MAJOR_CONFIGS[user.target_major_id]) return;
    setTransitioning(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_type: 'ucsb',
          school: 'University of California Santa Barbara (UCSB)',
          major: MAJOR_CONFIGS[user.target_major_id].name,
          majorId: user.target_major_id,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        onUserUpdate?.(updated);
        setShowTransitionModal(false);
      }
    } finally {
      setTransitioning(false);
    }
  };

  // Quarter plan for current-quarter section
  const currentQuarterCourses = user?.transcript?.in_progress ?? [];

  // Suggestions for current-quarter add-course
  const qtrSuggestions = qtrSearch.trim() && knownCourses
    ? (knownCourses).filter(c =>
        c.id.toLowerCase().includes(qtrSearch.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(qtrSearch.toLowerCase()))
      )
    : [];

  // Card shared style
  const cardStyle = {
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.radii.lg,
    padding: theme.spacing[6],
    boxShadow: theme.shadows.sm,
    border: `1px solid ${theme.colors.border}`,
  };

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.scale['3xl'],
          fontWeight: theme.typography.weight.bold,
          fontFamily: theme.typography.display,
          color: theme.colors.primary,
          margin: '0 0 8px 0',
        }}>
          Welcome back, {user?.firstName || 'Student'}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2], flexWrap: 'wrap' }}>
          {!editingMajor ? (
            <>
              <p style={{ color: theme.colors.gray[500], margin: 0 }}>
                Track your transfer progress toward{' '}
                {institution?.name ?? 'your community college'} &rarr; UCSB &mdash;{' '}
                <span style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.primary }}>
                  {targetMajorName}
                </span>
              </p>
              <button
                onClick={() => { setEditingMajor(true); setPendingMajorId(user?.target_major_id ?? ''); }}
                style={{
                  border: `1px solid ${theme.colors.gray[300]}`,
                  background: 'none',
                  borderRadius: theme.radii.md,
                  padding: `2px ${theme.spacing[2]}`,
                  fontSize: theme.typography.scale.xs,
                  color: theme.colors.gray[500],
                  cursor: 'pointer',
                }}
              >
                Change major
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
              <select
                value={pendingMajorId}
                onChange={e => setPendingMajorId(e.target.value)}
                style={{
                  padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.gray[300]}`,
                  fontSize: theme.typography.scale.sm,
                  color: theme.colors.gray[700],
                }}
              >
                {majorOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              <button
                onClick={handleMajorSave}
                disabled={savingMajor}
                style={{ padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radii.md, border: 'none', backgroundColor: theme.colors.primary, color: theme.colors.gray[50], fontSize: theme.typography.scale.xs, fontWeight: theme.typography.weight.semibold, cursor: savingMajor ? 'default' : 'pointer' }}
              >
                {savingMajor ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditingMajor(false)}
                style={{ padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.gray[300]}`, backgroundColor: 'transparent', color: theme.colors.gray[600], fontSize: theme.typography.scale.xs, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Three Progress Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: theme.spacing[6],
        marginBottom: theme.spacing[8],
      }}>

        {/* Card 1: Transfer Units */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: theme.spacing[6] }}>
          <ProgressRing progress={unitPercent} size={100} label="Units" />
          <div>
            <h3 style={{
              margin: '0 0 4px 0',
              color: theme.colors.gray[700],
              fontSize: theme.typography.scale.sm,
              fontFamily: theme.typography.display,
            }}>
              Transfer Units
            </h3>
            <p style={{ margin: 0, fontSize: theme.typography.scale['2xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary }}>
              {unitTotal} of 60
            </p>
            <p style={{ margin: '4px 0 0 0', color: theme.colors.gray[500], fontSize: theme.typography.scale.xs }}>
              {completedUnits} completed + {inProgressUnits} in progress
            </p>
          </div>
        </div>

        {/* Card 2: IGETC Requirements */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
            <ProgressRing progress={igetcPercent} size={80} label="IGETC" />
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                color: theme.colors.gray[700],
                fontSize: theme.typography.scale.sm,
                fontFamily: theme.typography.display,
              }}>
                IGETC Requirements
              </h3>
              <p style={{ margin: 0, color: theme.colors.gray[500], fontSize: theme.typography.scale.xs }}>
                {satisfiedIgetcAreas.size} of {IGETC_AREAS.length} areas satisfied
              </p>
            </div>
          </div>
          <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
            {IGETC_AREAS.map(area => {
              const isSatisfied = satisfiedIgetcAreas.has(area.id);
              // Find which CC course satisfies this area
              const satisfyingMapping = igetcMappings.find(
                m => m.igetc_area === area.id && completedCcCourses.includes(m.source_course_code)
              );
              return (
                <div key={area.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: `${theme.spacing[1]} 0`,
                  borderBottom: `1px solid ${theme.colors.gray[100]}`,
                  fontSize: theme.typography.scale.xs,
                  gap: theme.spacing[2],
                }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[700] }}>
                      {area.id}
                    </span>
                    {' '}
                    <span style={{ color: theme.colors.gray[500] }}>{area.label}</span>
                    {satisfyingMapping && (
                      <div style={{ color: theme.colors.gray[400], marginTop: '2px' }}>
                        via {satisfyingMapping.source_course_code}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontWeight: theme.typography.weight.semibold,
                    color: isSatisfied ? theme.colors.successActive : theme.colors.gray[400],
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {isSatisfied ? 'Done' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Major Lower-Division Requirements */}
        <div style={{ ...cardStyle }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[4], marginBottom: theme.spacing[4] }}>
            <ProgressRing progress={majorPercent} size={80} label="Major" />
            <div>
              <h3 style={{
                margin: '0 0 4px 0',
                color: theme.colors.gray[700],
                fontSize: theme.typography.scale.sm,
                fontFamily: theme.typography.display,
              }}>
                Lower-Division Requirements
              </h3>
              <p style={{ margin: 0, color: theme.colors.gray[500], fontSize: theme.typography.scale.xs }}>
                {targetMajorName}
              </p>
              <p style={{ margin: '4px 0 0 0', color: theme.colors.gray[500], fontSize: theme.typography.scale.xs }}>
                {satisfiedMajorCourses.size} of {allMajorLowerDivCourses.length} requirements satisfied
              </p>
            </div>
          </div>
          {articulations.length === 0 ? (
            <div style={{
              padding: theme.spacing[3],
              backgroundColor: theme.colors.warningSurface,
              borderRadius: theme.radii.md,
              fontSize: theme.typography.scale.xs,
              color: theme.colors.warningText,
              borderLeft: `3px solid ${theme.colors.warning}`,
            }}>
              No articulation data on file for {institution?.name ?? 'your institution'}. These requirements
              may still be transferable — check with your counselor.
            </div>
          ) : (
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {allMajorLowerDivCourses.map(courseId => {
                const isSatisfied = satisfiedMajorCourses.has(courseId);
                const satisfyingArt = isSatisfied
                  ? articulations.find(
                      art => art.articulation_type === 'equivalent'
                        && art.target_course?.course_id_clean === courseId
                        && completedCcCourses.includes(art.source_course_code)
                    )
                  : null;
                const satisfyingCode = satisfyingArt?.source_course_code ?? null;
                return (
                  <div key={courseId} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: `${theme.spacing[1]} 0`,
                    borderBottom: `1px solid ${theme.colors.gray[100]}`,
                    fontSize: theme.typography.scale.xs,
                    gap: theme.spacing[2],
                  }}>
                    <span style={{ color: theme.colors.gray[700], fontWeight: theme.typography.weight.medium }}>
                      {courseId}
                    </span>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{
                        fontWeight: theme.typography.weight.semibold,
                        color: isSatisfied ? theme.colors.successActive : theme.colors.gray[400],
                      }}>
                        {isSatisfied ? 'Satisfied' : 'Not satisfied'}
                      </div>
                      {satisfyingCode && (
                        <div style={{ color: theme.colors.gray[400], marginTop: '2px' }}>
                          via {satisfyingCode}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Current Quarter Section */}
      <div style={{
        backgroundColor: theme.colors.gray[50],
        borderRadius: theme.radii.lg,
        padding: theme.spacing[6],
        boxShadow: theme.shadows.sm,
        border: `1px solid ${theme.colors.border}`,
        marginBottom: theme.spacing[6],
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
          <h2 style={{
            margin: 0,
            fontSize: theme.typography.scale.lg,
            fontWeight: theme.typography.weight.semibold,
            fontFamily: theme.typography.display,
            color: theme.colors.gray[800],
          }}>
            Current Quarter
          </h2>
          <button
            onClick={() => { setEditingQuarter(e => !e); setQtrSearch(''); setQtrSugIdx(-1); setShowQtrSug(false); }}
            style={{
              padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
              borderRadius: theme.radii.md,
              border: `1px solid ${editingQuarter ? theme.colors.primary : theme.colors.gray[300]}`,
              backgroundColor: editingQuarter ? theme.colors.primary : theme.colors.gray[50],
              color: editingQuarter ? theme.colors.gray[50] : theme.colors.gray[600],
              fontSize: theme.typography.scale.xs,
              fontWeight: theme.typography.weight.semibold,
              cursor: 'pointer',
            }}
          >
            {editingQuarter ? 'Done' : 'Edit'}
          </button>
        </div>

        {currentQuarterCourses.length === 0 ? (
          <p style={{ color: theme.colors.gray[400], textAlign: 'center', padding: `${theme.spacing[5]} 0` }}>
            No courses in progress this quarter.
          </p>
        ) : (
          currentQuarterCourses.map((c, i) => {
            const courseId = extractCourseId(c.course);
            return (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: `${theme.spacing[3]} 0`,
                borderBottom: `1px solid ${theme.colors.gray[100]}`,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[800] }}>
                    {courseId}
                  </div>
                  <div style={{ fontSize: theme.typography.scale.sm, color: theme.colors.gray[500] }}>
                    {c.units ? `${c.units} units` : ''}
                  </div>
                </div>
                {editingQuarter && (
                  <button
                    onClick={() => onRemoveCourse(courseId, 'in_progress')}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: theme.colors.danger,
                      fontWeight: theme.typography.weight.bold,
                      fontSize: '1.1rem',
                      padding: `0 ${theme.spacing[1]}`,
                      lineHeight: 1,
                    }}
                    title="Remove from current quarter"
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })
        )}

        {/* Add course input — shown only in edit mode */}
        {editingQuarter && (
          <div style={{ marginTop: theme.spacing[4], position: 'relative' }} ref={qtrSearchRef}>
            <input
              type="text"
              value={qtrSearch}
              onChange={e => { setQtrSearch(e.target.value.toUpperCase()); setShowQtrSug(true); setQtrSugIdx(-1); }}
              onFocus={() => { setShowQtrSug(true); setQtrSugIdx(-1); }}
              onBlur={() => setTimeout(() => setShowQtrSug(false), 150)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (qtrSugIdx >= 0 && qtrSuggestions[qtrSugIdx]) {
                    const c = qtrSuggestions[qtrSugIdx];
                    onAddInProgress(c.id); setQtrSearch(''); setShowQtrSug(false); setQtrSugIdx(-1);
                  } else if (qtrSearch.trim()) {
                    // Allow free-text CC course code entry (e.g. "MATH 1A")
                    onAddInProgress(qtrSearch.trim()); setQtrSearch(''); setShowQtrSug(false); setQtrSugIdx(-1);
                  }
                  return;
                }
                if (!showQtrSug || qtrSuggestions.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setQtrSugIdx(i => {
                    const next = Math.min(i + 1, qtrSuggestions.length - 1);
                    qtrSugRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setQtrSugIdx(i => {
                    const next = Math.max(i - 1, 0);
                    qtrSugRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
                    return next;
                  });
                } else if (e.key === 'Escape') {
                  setShowQtrSug(false); setQtrSugIdx(-1);
                }
              }}
              placeholder="Add a course to this quarter..."
              style={{
                width: '100%',
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                borderRadius: theme.radii.md,
                border: `1px solid ${theme.colors.gray[300]}`,
                fontSize: theme.typography.scale.sm,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {showQtrSug && qtrSuggestions.length > 0 && (
              <div ref={qtrSugRef} style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                right: 0,
                marginBottom: '4px',
                backgroundColor: theme.colors.gray[50],
                border: `1px solid ${theme.colors.gray[300]}`,
                borderRadius: theme.radii.md,
                boxShadow: theme.shadows.md,
                maxHeight: '180px',
                overflowY: 'auto',
                zIndex: 20,
              }}>
                {qtrSuggestions.map((c, idx) => (
                  <div
                    key={c.id}
                    onMouseDown={() => { onAddInProgress(c.id); setQtrSearch(''); setShowQtrSug(false); setQtrSugIdx(-1); }}
                    onMouseEnter={() => setQtrSugIdx(idx)}
                    style={{
                      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.colors.gray[100]}`,
                      fontSize: theme.typography.scale.sm,
                      backgroundColor: idx === qtrSugIdx ? theme.colors.gray[100] : theme.colors.gray[50],
                    }}
                  >
                    <span style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.primary }}>{c.id}</span>
                    {c.name && <span style={{ color: theme.colors.gray[500], marginLeft: theme.spacing[2] }}>{c.name}</span>}
                    {c.units && <span style={{ color: theme.colors.gray[400], marginLeft: theme.spacing[2], fontSize: theme.typography.scale.xs }}>{c.units} units</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Educational History */}
      {(() => {
        const completed = user?.transcript?.completed ?? [];
        const inProgress = user?.transcript?.in_progress ?? [];
        return (
          <div style={{
            backgroundColor: theme.colors.gray[50],
            borderRadius: theme.radii.lg,
            padding: theme.spacing[6],
            boxShadow: theme.shadows.sm,
            border: `1px solid ${theme.colors.border}`,
          }}>
            <h2 style={{
              margin: `0 0 ${theme.spacing[4]} 0`,
              fontSize: theme.typography.scale.lg,
              fontWeight: theme.typography.weight.semibold,
              fontFamily: theme.typography.display,
              color: theme.colors.gray[800],
            }}>
              Educational History
            </h2>

            {completed.length === 0 && inProgress.length === 0 && (
              <div style={{ color: theme.colors.gray[400], fontSize: theme.typography.scale.sm, textAlign: 'center', padding: `${theme.spacing[4]} 0` }}>
                No courses recorded yet. Add completed courses above.
              </div>
            )}

            {inProgress.length > 0 && (
              <div style={{ marginBottom: theme.spacing[5] }}>
                <div style={{
                  fontSize: theme.typography.scale.xs,
                  fontWeight: theme.typography.weight.semibold,
                  color: theme.colors.gray[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: theme.spacing[2],
                }}>
                  In Progress
                </div>
                {inProgress.map((c, i) => {
                  const courseId = extractCourseId(c.course);
                  const grade = markCompleteGrades[courseId] ?? 'A';
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                      borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.infoSurface,
                      border: `1px solid ${theme.colors.infoBorder}`,
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        fontWeight: theme.typography.weight.semibold,
                        color: theme.colors.infoText,
                        fontSize: theme.typography.scale.sm,
                        minWidth: '80px',
                      }}>
                        {courseId}
                      </span>
                      <span style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], flex: 1 }}>
                        {c.units ? `${c.units} units` : ''}
                      </span>
                      <select
                        value={grade}
                        onChange={e => setMarkCompleteGrades(prev => ({ ...prev, [courseId]: e.target.value }))}
                        style={{
                          padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                          borderRadius: '6px',
                          border: `1px solid ${theme.colors.infoBorder}`,
                          fontSize: theme.typography.scale.xs,
                          backgroundColor: theme.colors.infoSurface,
                          color: theme.colors.infoText,
                          fontWeight: theme.typography.weight.semibold,
                          cursor: 'pointer',
                        }}
                      >
                        {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','P','NP'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onMarkComplete(courseId, grade)}
                        style={{
                          padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: theme.colors.success,
                          color: theme.colors.gray[50],
                          fontSize: theme.typography.scale.xs,
                          fontWeight: theme.typography.weight.semibold,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => onRemoveCourse(courseId, 'in_progress')}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: theme.colors.danger,
                          fontWeight: theme.typography.weight.bold,
                          fontSize: '1rem',
                          padding: `0 ${theme.spacing[1]}`,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                        title="Remove course"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {completed.length > 0 && (
              <div>
                <div style={{
                  fontSize: theme.typography.scale.xs,
                  fontWeight: theme.typography.weight.semibold,
                  color: theme.colors.gray[500],
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: theme.spacing[2],
                }}>
                  Completed
                </div>
                {completed.map((c, i) => {
                  const courseId = extractCourseId(c.course);
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing[3],
                      padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                      borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.successSurfaceLight,
                      border: `1px solid ${theme.colors.successBorder}`,
                      marginBottom: '6px',
                    }}>
                      <span style={{
                        fontWeight: theme.typography.weight.semibold,
                        color: theme.colors.successText,
                        fontSize: theme.typography.scale.sm,
                        minWidth: '80px',
                      }}>
                        {courseId}
                      </span>
                      <span style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], flex: 1 }}>
                        {c.units ? `${c.units} units` : ''}
                      </span>
                      <select
                        value={c.grade || 'A'}
                        onChange={e => onEditCourseGrade(courseId, e.target.value)}
                        style={{
                          padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
                          borderRadius: '6px',
                          border: `1px solid ${theme.colors.successBorder}`,
                          fontSize: theme.typography.scale.xs,
                          backgroundColor: theme.colors.successSurface,
                          color: theme.colors.successText,
                          fontWeight: theme.typography.weight.semibold,
                          cursor: 'pointer',
                        }}
                      >
                        {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','P','NP'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onRemoveCourse(courseId, 'completed')}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          color: theme.colors.danger,
                          fontWeight: theme.typography.weight.bold,
                          fontSize: '1rem',
                          padding: `0 ${theme.spacing[1]}`,
                          lineHeight: 1,
                          flexShrink: 0,
                        }}
                        title="Remove course"
                      >
                        &times;
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* UCSB Transition Section */}
      <div style={{ marginTop: theme.spacing[8], padding: theme.spacing[6], backgroundColor: theme.colors.gray[50], borderRadius: theme.radii.lg, border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows.sm }}>
        <h2 style={{ margin: `0 0 ${theme.spacing[2]} 0`, fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display, color: theme.colors.gray[800] }}>
          Ready to Transfer?
        </h2>
        <p style={{ color: theme.colors.gray[500], margin: `0 0 ${theme.spacing[4]} 0`, fontSize: theme.typography.scale.sm }}>
          Once admitted to UCSB, switch your account to start planning your UCSB degree. Your CC courses remain in your history.
        </p>
        <button
          onClick={() => setShowTransitionModal(true)}
          style={{ padding: `${theme.spacing[2]} ${theme.spacing[5]}`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.primary}`, backgroundColor: 'transparent', color: theme.colors.primary, fontSize: theme.typography.scale.sm, fontWeight: theme.typography.weight.semibold, cursor: 'pointer' }}
        >
          I've been admitted to UCSB
        </button>
      </div>

      {showTransitionModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: theme.colors.gray[50], borderRadius: theme.radii.xl, padding: theme.spacing[8], maxWidth: '480px', width: '90%', boxShadow: theme.shadows.lg }}>
            <h3 style={{ margin: `0 0 ${theme.spacing[3]} 0`, fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.bold, fontFamily: theme.typography.display, color: theme.colors.primary }}>
              Switch to UCSB Student Mode
            </h3>
            <p style={{ color: theme.colors.gray[600], margin: `0 0 ${theme.spacing[2]} 0`, fontSize: theme.typography.scale.sm }}>
              This will convert your account to a UCSB student. Your target major &mdash; <strong>{targetMajorName}</strong> &mdash; will become your declared major.
            </p>
            <p style={{ color: theme.colors.gray[500], margin: `0 0 ${theme.spacing[6]} 0`, fontSize: theme.typography.scale.sm }}>
              Your completed CC courses will be kept in your history. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: theme.spacing[3], justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowTransitionModal(false)}
                disabled={transitioning}
                style={{ padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radii.md, border: `1px solid ${theme.colors.gray[300]}`, backgroundColor: 'transparent', color: theme.colors.gray[700], fontSize: theme.typography.scale.sm, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={handleUcsbTransition}
                disabled={transitioning}
                style={{ padding: `${theme.spacing[2]} ${theme.spacing[4]}`, borderRadius: theme.radii.md, border: 'none', backgroundColor: theme.colors.primary, color: theme.colors.gray[50], fontSize: theme.typography.scale.sm, fontWeight: theme.typography.weight.semibold, cursor: transitioning ? 'default' : 'pointer' }}
              >
                {transitioning ? 'Switching...' : 'Confirm: Switch to UCSB'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
