import React, { useState, useRef, useEffect } from 'react';
import { theme } from '../styles/theme.js';
import { StatusBadge } from './shared/StatusBadge.jsx';
import { DifficultyBadge } from './shared/DifficultyBadge.jsx';
import { ProgressRing } from './shared/ProgressRing.jsx';
import { extractCourseId, buildKnownCourses } from '../utils/courseUtils.js';
import { EndQuarterModal } from './EndQuarterModal.jsx';
import { TransferDashboardView } from './TransferDashboardView.jsx';

export const DashboardView = ({ user, requirements, quarterPlan, onAddCourse, onRemoveCourse, onEditCourseGrade, onAddInProgress, onMarkComplete, onEndQuarter, knownCourses, onUserUpdate }) => {
  const [addCourseId, setAddCourseId] = useState('');
  const [addCourseGrade, setAddCourseGrade] = useState('A');
  const [addCourseUnits, setAddCourseUnits] = useState(4);
  const [addCourseMsg, setAddCourseMsg] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [markCompleteGrades, setMarkCompleteGrades] = useState({});
  const [showEndQuarter, setShowEndQuarter] = useState(false);

  // Current quarter editing
  const [editingQuarter, setEditingQuarter] = useState(false);
  const [qtrSearch, setQtrSearch] = useState('');
  const [qtrSugIdx, setQtrSugIdx] = useState(-1);
  const [showQtrSug, setShowQtrSug] = useState(false);
  const qtrSearchRef = useRef(null);
  const qtrSugRef = useRef(null);

  // Build local known courses from this user's requirements + quarter plan
  const localKnownCourses = React.useMemo(
    () => buildKnownCourses(requirements, quarterPlan),
    [requirements, quarterPlan]
  );

  // Transfer students: delegate to dedicated view
  if (user?.student_type === 'transfer') {
    return (
      <TransferDashboardView
        user={user}
        onAddCourse={onAddCourse}
        onRemoveCourse={onRemoveCourse}
        onEditCourseGrade={onEditCourseGrade}
        onAddInProgress={onAddInProgress}
        onMarkComplete={onMarkComplete}
        onEndQuarter={onEndQuarter}
        knownCourses={knownCourses}
        onUserUpdate={onUserUpdate}
      />
    );
  }

  // Filter known courses: exclude already-completed ones and match search input
  const completedIds = new Set(
    (user?.transcript?.completed || []).map(c => extractCourseId(c.course))
  );
  const inProgressIds = new Set(
    (user?.transcript?.in_progress || []).map(c => extractCourseId(c.course))
  );
  const filteredSuggestions = localKnownCourses.filter(c =>
    !completedIds.has(c.id) &&
    c.id.toLowerCase().includes(addCourseId.toLowerCase())
  );
  const isValidCourse = localKnownCourses.some(c => c.id === addCourseId.trim());

  // Current quarter add-course suggestions
  const qtrSuggestions = qtrSearch.trim()
    ? localKnownCourses.filter(c =>
        !completedIds.has(c.id) &&
        !inProgressIds.has(c.id) &&
        (c.id.toLowerCase().includes(qtrSearch.toLowerCase()) ||
         c.name.toLowerCase().includes(qtrSearch.toLowerCase()))
      )
    : [];

  const allCourses = Object.values(requirements).flatMap(cat => cat.courses || []);
  const completedMajorCourses = allCourses.filter(c => c.status === 'completed');
  const majorUnits = completedMajorCourses.reduce((sum, c) => sum + c.units, 0);
  const totalMajorUnits = allCourses.reduce((sum, c) => sum + c.units, 0);

  // Total completed units including non-major courses from transcript
  const transcriptCompletedUnits = user?.transcript?.completed
    ? user.transcript.completed.reduce((sum, c) => sum + (c.units || 0), 0)
    : majorUnits;
  const completedUnits = Math.max(transcriptCompletedUnits, majorUnits);
  const totalUnits = 120;

  // GE estimates: non-major completed units are assumed GE
  const nonMajorUnits = Math.max(0, completedUnits - majorUnits);
  const geUnits = nonMajorUnits;
  const totalGeUnits = 36;

  const currentQuarter = quarterPlan.length > 0 ? quarterPlan[0] : null;

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
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          You're making great progress toward your {user?.major || 'degree'}
        </p>
      </div>

      {/* Progress Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Overall Progress */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          boxShadow: theme.shadows.sm,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[6],
        }}>
          <ProgressRing progress={Math.round((completedUnits/totalUnits)*100)} label="Complete" />
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: theme.colors.gray[700], fontSize: '0.9rem', fontFamily: theme.typography.display }}>
              Overall Progress
            </h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: theme.colors.primary }}>
              {completedUnits}/{totalUnits} units
            </p>
            <p style={{ margin: '4px 0 0 0', color: theme.colors.gray[500], fontSize: '0.85rem' }}>
              ~{Math.max(1, Math.ceil((totalUnits - completedUnits) / 16))} quarters remaining
            </p>
          </div>
        </div>

        {/* Major Progress */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          boxShadow: theme.shadows.sm,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[6],
        }}>
          <ProgressRing progress={Math.round((majorUnits/totalMajorUnits)*100)} label="Major" />
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: theme.colors.gray[700], fontSize: '0.9rem', fontFamily: theme.typography.display }}>
              Major Requirements
            </h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: theme.colors.primary }}>
              {majorUnits}/{totalMajorUnits} units
            </p>
            <p style={{ margin: '4px 0 0 0', color: theme.colors.gray[500], fontSize: '0.85rem' }}>
              {completedMajorCourses.length} of {allCourses.length} courses done
            </p>
          </div>
        </div>

        {/* GE Progress */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          boxShadow: theme.shadows.sm,
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing[6],
        }}>
          <ProgressRing progress={Math.min(100, Math.round((geUnits/totalGeUnits)*100))} label="GE" />
          <div>
            <h3 style={{ margin: '0 0 4px 0', color: theme.colors.gray[700], fontSize: '0.9rem', fontFamily: theme.typography.display }}>
              General Education
            </h3>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: theme.colors.primary }}>
              {Math.min(geUnits, totalGeUnits)}/{totalGeUnits} units
            </p>
            <p style={{ margin: '4px 0 0 0', color: theme.colors.gray[500], fontSize: '0.85rem' }}>
              Estimated from transcript
            </p>
          </div>
        </div>
      </div>

      {/* Current Quarter & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Current Quarter */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          boxShadow: theme.shadows.sm,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display, color: theme.colors.gray[800] }}>
              {currentQuarter ? `Current Quarter - ${currentQuarter.quarter}` : 'No Upcoming Quarters'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {user?.transcript?.in_progress?.length > 0 && !editingQuarter && (
                <button
                  onClick={() => setShowEndQuarter(true)}
                  style={{
                    background: theme.colors.secondary,
                    color: theme.colors.primary,
                    border: 'none',
                    borderRadius: theme.radii.full,
                    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
                    fontSize: theme.typography.scale.sm,
                    fontWeight: theme.typography.weight.semibold,
                    cursor: 'pointer',
                  }}
                >
                  End Quarter
                </button>
              )}
              {currentQuarter && !editingQuarter && (
                <span style={{
                  backgroundColor: theme.colors.primarySurface,
                  color: theme.colors.primary,
                  padding: '4px 12px',
                  borderRadius: theme.radii.full,
                  fontSize: theme.typography.scale.xs,
                  fontWeight: theme.typography.weight.semibold,
                }}>
                  {currentQuarter.totalUnits} Units
                </span>
              )}
              <button
                onClick={() => { setEditingQuarter(e => !e); setQtrSearch(''); setQtrSugIdx(-1); setShowQtrSug(false); }}
                style={{
                  padding: '4px 12px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${editingQuarter ? theme.colors.primary : theme.colors.gray[300]}`,
                  backgroundColor: editingQuarter ? theme.colors.primary : 'white',
                  color: editingQuarter ? 'white' : theme.colors.gray[600],
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {editingQuarter ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>

          {currentQuarter ? currentQuarter.courses.map(course => (
            <div key={course.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 0',
              borderBottom: `1px solid ${theme.colors.gray[100]}`,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', color: theme.colors.gray[800] }}>{course.id}</div>
                <div style={{ fontSize: '0.85rem', color: theme.colors.gray[500] }}>{course.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <DifficultyBadge score={course.difficulty} size="small" />
                {editingQuarter && (
                  <button
                    onClick={() => onRemoveCourse(course.id, 'in_progress')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.danger, fontWeight: '700', fontSize: '1.1rem', padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
                    title="Remove from current quarter"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          )) : (
            <p style={{ color: theme.colors.gray[400], textAlign: 'center', padding: '20px 0' }}>
              All planned courses are completed!
            </p>
          )}

          {/* Add course input — shown only in edit mode */}
          {editingQuarter && (
            <div style={{ marginTop: '16px', position: 'relative' }} ref={qtrSearchRef}>
              <input
                type="text"
                value={qtrSearch}
                onChange={e => { setQtrSearch(e.target.value.toUpperCase()); setShowQtrSug(true); setQtrSugIdx(-1); }}
                onFocus={() => { setShowQtrSug(true); setQtrSugIdx(-1); }}
                onBlur={() => setTimeout(() => setShowQtrSug(false), 150)}
                onKeyDown={e => {
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
                  } else if (e.key === 'Enter' && qtrSugIdx >= 0) {
                    e.preventDefault();
                    const c = qtrSuggestions[qtrSugIdx];
                    if (c) { onAddInProgress(c.id); setQtrSearch(''); setShowQtrSug(false); setQtrSugIdx(-1); }
                  } else if (e.key === 'Escape') {
                    setShowQtrSug(false); setQtrSugIdx(-1);
                  }
                }}
                placeholder="Add a course to this quarter..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: theme.radii.md,
                  border: `1px solid ${theme.colors.gray[300]}`,
                  fontSize: '0.875rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              {showQtrSug && qtrSuggestions.length > 0 && (
                <div ref={qtrSugRef} style={{
                  position: 'absolute', bottom: '100%', left: 0, right: 0,
                  marginBottom: '4px', backgroundColor: 'white',
                  border: `1px solid ${theme.colors.gray[300]}`, borderRadius: theme.radii.md,
                  boxShadow: theme.shadows.md,
                  maxHeight: '180px', overflowY: 'auto', zIndex: 20,
                }}>
                  {qtrSuggestions.map((c, idx) => (
                    <div
                      key={c.id}
                      onMouseDown={() => { onAddInProgress(c.id); setQtrSearch(''); setShowQtrSug(false); setQtrSugIdx(-1); }}
                      onMouseEnter={() => setQtrSugIdx(idx)}
                      style={{
                        padding: '8px 12px', cursor: 'pointer',
                        borderBottom: `1px solid ${theme.colors.gray[100]}`, fontSize: '0.85rem',
                        backgroundColor: idx === qtrSugIdx ? theme.colors.gray[100] : 'white',
                      }}
                    >
                      <span style={{ fontWeight: '600', color: theme.colors.primary }}>{c.id}</span>
                      <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{c.name}</span>
                      <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{c.units} units</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications / Alerts */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          padding: theme.spacing[6],
          boxShadow: theme.shadows.sm,
        }}>
          <h2 style={{ margin: '0 0 20px 0', fontSize: '1.1rem', fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display, color: theme.colors.gray[800] }}>
            Notifications
          </h2>

          <div style={{
            padding: '12px 16px',
            backgroundColor: theme.colors.warningSurface,
            borderRadius: theme.radii.md,
            marginBottom: '12px',
            borderLeft: `4px solid ${theme.colors.warning}`,
          }}>
            <div style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.warningText, marginBottom: '4px' }}>
              ECON 10A opens tomorrow!
            </div>
            <div style={{ fontSize: '0.85rem', color: theme.colors.warningText }}>
              Registration for Winter 2026 starts Nov 15
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: theme.colors.successSurface,
            borderRadius: theme.radii.md,
            marginBottom: '12px',
            borderLeft: `4px solid ${theme.colors.success}`,
          }}>
            <div style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.successText, marginBottom: '4px' }}>
              Pre-requisite cleared!
            </div>
            <div style={{ fontSize: '0.85rem', color: theme.colors.successText }}>
              ECON 2 completed - you can now enroll in ECON 10B
            </div>
          </div>

          <div style={{
            padding: '12px 16px',
            backgroundColor: theme.colors.gray[100],
            borderRadius: theme.radii.md,
            borderLeft: `4px solid ${theme.colors.gray[500]}`,
          }}>
            <div style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[700], marginBottom: '4px' }}>
              Advising appointment available
            </div>
            <div style={{ fontSize: '0.85rem', color: theme.colors.gray[500] }}>
              Book a meeting with an Economics advisor
            </div>
          </div>
        </div>
      </div>

      {/* Add Completed Course */}
      <div style={{
        marginTop: theme.spacing[6],
        backgroundColor: 'white',
        borderRadius: theme.radii.lg,
        padding: theme.spacing[6],
        boxShadow: theme.shadows.sm,
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display, color: theme.colors.gray[800] }}>
          Add Completed Course
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: '1', minWidth: '220px', position: 'relative' }} ref={inputRef}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: theme.colors.gray[600], marginBottom: '4px' }}>
              Course
            </label>
            <input
              type="text"
              placeholder="Search courses..."
              value={addCourseId}
              onChange={e => { setAddCourseId(e.target.value.toUpperCase()); setAddCourseMsg(''); setShowSuggestions(true); setSuggestionIndex(-1); }}
              onFocus={() => { setShowSuggestions(true); setSuggestionIndex(-1); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={e => {
                if (!showSuggestions || filteredSuggestions.length === 0) return;
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setSuggestionIndex(i => {
                    const next = Math.min(i + 1, filteredSuggestions.length - 1);
                    if (suggestionsRef.current) {
                      const item = suggestionsRef.current.children[next];
                      if (item) item.scrollIntoView({ block: 'nearest' });
                    }
                    return next;
                  });
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setSuggestionIndex(i => {
                    const next = Math.max(i - 1, 0);
                    if (suggestionsRef.current) {
                      const item = suggestionsRef.current.children[next];
                      if (item) item.scrollIntoView({ block: 'nearest' });
                    }
                    return next;
                  });
                } else if (e.key === 'Enter' && suggestionIndex >= 0) {
                  e.preventDefault();
                  const c = filteredSuggestions[suggestionIndex];
                  if (c) {
                    setAddCourseId(c.id);
                    setAddCourseUnits(c.units);
                    setShowSuggestions(false);
                    setSuggestionIndex(-1);
                    setAddCourseMsg('');
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false);
                  setSuggestionIndex(-1);
                }
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${addCourseId.trim() && !isValidCourse ? theme.colors.danger : theme.colors.gray[300]}`,
                borderRadius: theme.radii.md,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
            {showSuggestions && addCourseId.trim() && filteredSuggestions.length > 0 && (
              <div ref={suggestionsRef} style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: `1px solid ${theme.colors.gray[300]}`,
                borderRadius: theme.radii.md,
                marginTop: '4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: theme.shadows.md,
              }}>
                {filteredSuggestions.map((c, idx) => (
                  <div
                    key={c.id}
                    onMouseDown={() => {
                      setAddCourseId(c.id);
                      setAddCourseUnits(c.units);
                      setShowSuggestions(false);
                      setSuggestionIndex(-1);
                      setAddCourseMsg('');
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: `1px solid ${theme.colors.gray[100]}`,
                      fontSize: '0.85rem',
                      backgroundColor: idx === suggestionIndex ? theme.colors.gray[100] : 'white',
                    }}
                    onMouseEnter={() => setSuggestionIndex(idx)}
                  >
                    <span style={{ fontWeight: '600', color: theme.colors.primary }}>{c.id}</span>
                    <span style={{ color: theme.colors.gray[500], marginLeft: '8px' }}>{c.name}</span>
                    <span style={{ color: theme.colors.gray[400], marginLeft: '8px', fontSize: '0.75rem' }}>{c.units} units</span>
                  </div>
                ))}
              </div>
            )}
            {addCourseId.trim() && !isValidCourse && !showSuggestions && (
              <div style={{ fontSize: '0.75rem', color: theme.colors.danger, marginTop: '2px' }}>
                Course not found. Select from the list.
              </div>
            )}
          </div>
          <div style={{ minWidth: '90px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: theme.colors.gray[600], marginBottom: '4px' }}>
              Grade
            </label>
            <select
              value={addCourseGrade}
              onChange={e => setAddCourseGrade(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.colors.gray[300]}`,
                borderRadius: theme.radii.md,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            >
              {['A+','A','A-','B+','B','B-','C+','C','C-','D','F','P','NP'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '80px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: theme.colors.gray[600], marginBottom: '4px' }}>
              Units
            </label>
            <input
              type="number"
              min="1"
              max="8"
              value={addCourseUnits}
              onChange={e => setAddCourseUnits(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: `1px solid ${theme.colors.gray[300]}`,
                borderRadius: theme.radii.md,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <button
            disabled={!isValidCourse || completedIds.has(addCourseId.trim())}
            onClick={() => {
              const id = addCourseId.trim();
              if (!id || !isValidCourse) return;
              if (completedIds.has(id)) { setAddCourseMsg('Course already completed'); return; }
              const known = localKnownCourses.find(c => c.id === id);
              onAddCourse({ course: id, grade: addCourseGrade, units: known ? known.units : addCourseUnits });
              setAddCourseId('');
              setAddCourseGrade('A');
              setAddCourseUnits(4);
              setAddCourseMsg(`Added ${id}`);
            }}
            style={{
              padding: '8px 20px',
              backgroundColor: !isValidCourse || completedIds.has(addCourseId.trim()) ? theme.colors.gray[300] : theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: theme.radii.md,
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: !isValidCourse || completedIds.has(addCourseId.trim()) ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Add Course
          </button>
        </div>
        {addCourseMsg && (
          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: theme.colors.success, fontWeight: '500' }}>
            {addCourseMsg}
          </div>
        )}
      </div>

      {/* Educational History */}
      {(() => {
        const completed = user?.transcript?.completed || [];
        const inProgress = user?.transcript?.in_progress || [];
        return (
          <div style={{
            marginTop: theme.spacing[6],
            backgroundColor: 'white',
            borderRadius: theme.radii.lg,
            padding: theme.spacing[6],
            boxShadow: theme.shadows.sm,
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.1rem', fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display, color: theme.colors.gray[800] }}>
              Educational History
            </h2>

            {completed.length === 0 && inProgress.length === 0 && (
              <div style={{ color: theme.colors.gray[400], fontSize: '0.875rem', textAlign: 'center', padding: '16px 0' }}>
                No courses recorded yet. Add completed courses above.
              </div>
            )}

            {inProgress.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: theme.colors.gray[500], textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  In Progress
                </div>
                {inProgress.map((c, i) => {
                  const courseId = extractCourseId(c.course);
                  const known = localKnownCourses.find(k => k.id === courseId);
                  const grade = markCompleteGrades[courseId] ?? 'A';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.infoSurface, border: `1px solid ${theme.colors.infoBorder}`,
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontWeight: '600', color: theme.colors.infoText, fontSize: '0.9rem', minWidth: '80px' }}>{courseId}</span>
                      {known && <span style={{ fontSize: '0.8rem', color: theme.colors.gray[500], flex: 1 }}>{known.name}</span>}
                      <select
                        value={grade}
                        onChange={e => setMarkCompleteGrades(prev => ({ ...prev, [courseId]: e.target.value }))}
                        style={{
                          padding: '4px 8px', borderRadius: '6px',
                          border: `1px solid ${theme.colors.infoBorder}`, fontSize: '0.8rem',
                          backgroundColor: theme.colors.infoSurface, color: theme.colors.infoText, fontWeight: '600',
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
                          padding: '4px 10px', borderRadius: '6px', border: 'none',
                          backgroundColor: theme.colors.success, color: 'white',
                          fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => onRemoveCourse(courseId, 'in_progress')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.danger, fontWeight: '700', fontSize: '1rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
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
                <div style={{ fontSize: '0.8rem', fontWeight: '600', color: theme.colors.gray[500], textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Completed
                </div>
                {completed.map((c, i) => {
                  const courseId = extractCourseId(c.course);
                  const known = localKnownCourses.find(k => k.id === courseId);
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 12px', borderRadius: theme.radii.md,
                      backgroundColor: theme.colors.successSurfaceLight, border: `1px solid ${theme.colors.successBorder}`,
                      marginBottom: '6px',
                    }}>
                      <span style={{ fontWeight: '600', color: theme.colors.successText, fontSize: '0.9rem', minWidth: '80px' }}>{courseId}</span>
                      {known && <span style={{ fontSize: '0.8rem', color: theme.colors.gray[500], flex: 1 }}>{known.name}</span>}
                      <select
                        value={c.grade || 'A'}
                        onChange={e => onEditCourseGrade(courseId, e.target.value)}
                        style={{
                          padding: '4px 8px', borderRadius: '6px',
                          border: `1px solid ${theme.colors.successBorder}`, fontSize: '0.8rem',
                          backgroundColor: theme.colors.successSurface, color: theme.colors.successText, fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {['A+','A','A-','B+','B','B-','C+','C','C-','D+','D','D-','F','P','NP'].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => onRemoveCourse(courseId, 'completed')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.colors.danger, fontWeight: '700', fontSize: '1rem', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
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
    {showEndQuarter && (
      <EndQuarterModal
        inProgressCourses={(user?.transcript?.in_progress || []).map(c => {
          const id = extractCourseId(c.course);
          const known = (knownCourses || []).find(k => k.id === id);
          return { id, name: known?.name || id, units: known?.units || 4 };
        })}
        knownCourses={knownCourses || []}
        completedCourseIds={new Set((user?.transcript?.completed || []).map(c => extractCourseId(c.course)))}
        onEndQuarter={(gradeMap, nextCourseIds) => {
          onEndQuarter(gradeMap, nextCourseIds);
          setShowEndQuarter(false);
        }}
        onClose={() => setShowEndQuarter(false)}
      />
    )}
    </div>
  );
};
