import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { theme } from '../styles/theme.js';
import { RequirementsView } from './RequirementsView.jsx';
import { QuarterPlannerView } from './QuarterPlannerView.jsx';
import { StatusBadge } from './shared/StatusBadge.jsx';
import { DifficultyBadge } from './shared/DifficultyBadge.jsx';
import { ProgressRing } from './shared/ProgressRing.jsx';
import { TransferRoadmapView } from './TransferRoadmapView.jsx';

export const RoadmapView = ({ user, requirements, quarterPlan, prereqEdges }) => {
  if (user?.student_type === 'transfer') {
    return <TransferRoadmapView user={user} />;
  }

  const diagramRef = useRef(null);
  const nodeRefs   = useRef({});
  const [svgLines, setSvgLines] = useState([]);

  // Derive header color from the completion state of a stage's courses.
  const stageHeaderStyle = (courses) => {
    const allDone   = courses.every(c => c.status === 'completed');
    const anyActive = courses.some(c => c.status === 'completed' || c.status === 'in_progress');
    if (allDone)   return { bg: theme.colors.successActive, text: 'white' };
    if (anyActive) return { bg: theme.colors.warningActive, text: 'white' };
    return               { bg: theme.colors.gray[400], text: 'white' };
  };

  const stages = [
    {
      key: 'preMajor',
      label: 'Pre-Major',
      courses: requirements.preMajor.courses,
    },
    {
      key: 'prep',
      label: 'Preparation for the Major',
      courses: requirements.preparationForMajor.courses,
    },
    {
      key: 'upperRequired',
      label: 'Upper-Division Required',
      courses: requirements.upperDivRequired.courses,
    },
    {
      key: 'upper',
      label: 'Upper-Division Electives',
      courses: requirements.upperDivElectives.courses,
    },
  ];

  // Recompute SVG bezier paths after each render and on window resize.
  useLayoutEffect(() => {
    const compute = () => {
      const diag = diagramRef.current;
      if (!diag) return;
      const diagRect = diag.getBoundingClientRect();
      const lines = [];

      for (const { from, to } of (prereqEdges || [])) {
        const fEl = nodeRefs.current[from];
        const tEl = nodeRefs.current[to];
        if (!fEl || !tEl) continue;

        const fR = fEl.getBoundingClientRect();
        const tR = tEl.getBoundingClientRect();

        const x1 = fR.right  - diagRect.left;
        const y1 = (fR.top + fR.bottom) / 2 - diagRect.top;
        const x2 = tR.left   - diagRect.left;
        const y2 = (tR.top + tR.bottom) / 2 - diagRect.top;
        const cx = (x1 + x2) / 2;

        lines.push({ key: `${from}__${to}`, d: `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}` });
      }
      setSvgLines(lines);
    };

    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  const nodeColors = (status) => {
    if (status === 'completed')
      return { bg: theme.colors.successSurfaceLight, border: theme.colors.successActive, iconColor: theme.colors.successActive, textColor: theme.colors.successTextDark };
    if (status === 'in_progress')
      return { bg: theme.colors.warningSurfaceLight, border: theme.colors.warningActive, iconColor: theme.colors.warningActive, textColor: theme.colors.warningTextDark };
    return   { bg: theme.colors.gray[50], border: theme.colors.gray[300], iconColor: theme.colors.gray[400], textColor: theme.colors.gray[700] };
  };

  const CheckIcon = ({ color, size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path d="M2 6.5L4.5 9L10 3" stroke={color} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ClockIcon = ({ color, size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none"
         xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 3.5V6L7.5 7.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  // Compact requirements category for the panel below the diagram.
  const renderCategory = (key, category) => {
    const completed = category.courses.filter(c => c.status === 'completed').length;
    const total = category.courses.length;
    const completedUnits = category.courses
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.units, 0);
    return (
      <div key={key} style={{
        backgroundColor: 'white', borderRadius: theme.radii.lg,
        padding: theme.spacing[5], marginBottom: theme.spacing[4],
        boxShadow: theme.shadows.sm,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', color: theme.colors.primary }}>
              {category.name}
            </h3>
            <p style={{ margin: 0, color: theme.colors.gray[500], fontSize: '0.8rem' }}>
              {completed}/{total} courses ({completedUnits}/{category.units} units)
            </p>
          </div>
          <div style={{ width: '80px' }}>
            <div style={{ height: '6px', backgroundColor: theme.colors.gray[200], borderRadius: theme.radii.full, overflow: 'hidden' }}>
              <div style={{ width: `${(completed/total)*100}%`, height: '100%', backgroundColor: theme.colors.success }} />
            </div>
          </div>
        </div>
        {category.courses.map(course => (
          <div key={course.id} style={{
            display: 'flex', alignItems: 'center', padding: theme.spacing[3], borderRadius: theme.radii.md,
            backgroundColor: course.status === 'completed' ? theme.colors.successSurfaceLight : course.status === 'in_progress' ? theme.colors.infoSurfaceLight : theme.colors.surface,
            marginBottom: theme.spacing[2],
            border: `1px solid ${course.status === 'completed' ? theme.colors.successBorderLight : course.status === 'in_progress' ? theme.colors.infoBorderLight : theme.colors.gray[200]}`,
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
              backgroundColor: course.status === 'completed' ? theme.colors.success : course.status === 'in_progress' ? theme.colors.info : theme.colors.gray[200],
              color: (course.status === 'completed' || course.status === 'in_progress') ? 'white' : theme.colors.gray[400],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '700', fontSize: '0.75rem', marginRight: '12px',
            }}>
              {course.status === 'completed' ? '✓' : course.status === 'in_progress' ? '◐' : '○'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: '600', color: theme.colors.gray[800], fontSize: '0.9rem' }}>{course.id}</span>
                {course.grade && (
                  <span style={{ backgroundColor: theme.colors.successSurface, color: theme.colors.successText, padding: `1px ${theme.spacing[2]}`, borderRadius: theme.radii.sm, fontSize: theme.typography.scale.xs, fontWeight: theme.typography.weight.semibold }}>
                    {course.grade}
                  </span>
                )}
              </div>
              <div style={{ color: theme.colors.gray[500], fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {course.name}
              </div>
            </div>
            <DifficultyBadge score={course.difficulty} size="small" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: theme.typography.scale['3xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary, margin: '0 0 6px 0', fontFamily: theme.typography.display }}>
          Your Roadmap
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          Visual prerequisite map for {user?.major || 'Economics B.A.'} — lines show prerequisites
        </p>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { status: 'completed',   label: 'Completed'   },
          { status: 'in_progress', label: 'In Progress' },
          { status: 'not_started', label: 'Not Started' },
        ].map(({ status, label }) => {
          const c = nodeColors(status);
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 30, height: 20, borderRadius: 4,
                backgroundColor: c.bg, border: `2px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {status === 'completed'   && <CheckIcon color={c.iconColor} />}
                {status === 'in_progress' && <ClockIcon color={c.iconColor} />}
              </div>
              <span style={{ fontSize: '0.82rem', color: theme.colors.gray[600] }}>{label}</span>
            </div>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: theme.colors.gray[400] }}>
          Lines show prerequisites
        </span>
      </div>

      {/* Diagram */}
      <div
        ref={diagramRef}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          width: '100%',
          marginBottom: 32,
          paddingBottom: 8,
        }}
      >
        {/* SVG line layer — behind cards */}
        <svg
          style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            overflow: 'visible', pointerEvents: 'none', zIndex: 0,
          }}
        >
          {svgLines.map(({ key, d }) => (
            <path key={key} d={d} fill="none" stroke={theme.colors.slateGray} strokeWidth="1.5"/>
          ))}
        </svg>

        {/* Stage columns */}
        {stages.map((stage, si) => {
          const hs = stageHeaderStyle(stage.courses);
          return (
            <React.Fragment key={stage.key}>
              <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                {/* Column header */}
                <div style={{
                  backgroundColor: hs.bg,
                  color: hs.text,
                  padding: '9px 14px',
                  borderRadius: theme.radii.md,
                  marginBottom: 16,
                  textAlign: 'center',
                  fontWeight: theme.typography.weight.semibold,
                  fontSize: theme.typography.scale.xs,
                  lineHeight: 1.4,
                  boxShadow: theme.shadows.md,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                  {(() => {
                    const allDone   = stage.courses.every(c => c.status === 'completed');
                    const anyActive = stage.courses.some(c => c.status === 'completed' || c.status === 'in_progress');
                    if (allDone)   return <CheckIcon color="white" size={13} />;
                    if (anyActive) return <ClockIcon color="white" size={13} />;
                    return null;
                  })()}
                  {stage.label}
                </div>

                {/* Course nodes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {stage.courses.map(course => {
                    const c = nodeColors(course.status);
                    return (
                      <div
                        key={course.id}
                        ref={el => { nodeRefs.current[course.id] = el; }}
                        style={{
                          backgroundColor: c.bg,
                          border: `2px solid ${c.border}`,
                          borderRadius: theme.radii.md,
                          padding: theme.spacing[3],
                          boxShadow: theme.shadows.xs,
                          position: 'relative', zIndex: 1,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                          {course.status === 'completed'   && <CheckIcon color={c.iconColor} />}
                          {course.status === 'in_progress' && <ClockIcon color={c.iconColor} />}
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.textColor, flexShrink: 0 }}>
                            {course.id}
                          </span>
                          {course.grade && (
                            <span style={{
                              marginLeft: 'auto', flexShrink: 0,
                              backgroundColor: theme.colors.successSurface, color: theme.colors.successText,
                              padding: `1px ${theme.spacing[2]}`, borderRadius: theme.radii.sm,
                              fontSize: '0.66rem', fontWeight: theme.typography.weight.bold,
                            }}>
                              {course.grade}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: c.textColor, lineHeight: 1.35, opacity: 0.85 }}>
                          {course.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Gap spacer */}
              {si < stages.length - 1 && (
                <div style={{ flex: '0 0 56px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: `1px solid ${theme.colors.gray[200]}`, margin: '0 0 28px 0' }} />

      {/* Requirements + Quarter Planner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

        {/* Left: Requirements checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            backgroundColor: theme.colors.primary, color: 'white',
            padding: `${theme.spacing[4]} ${theme.spacing[5]}`, borderRadius: `${theme.radii.lg} ${theme.radii.lg} 0 0`,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="2" y="1" width="14" height="16" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M5 6h8M5 10h8M5 14h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <h2 style={{ margin: 0, fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display }}>Requirements</h2>
              <p style={{ margin: 0, fontSize: theme.typography.scale.xs, opacity: 0.8 }}>{user?.major || 'Economics B.A.'}</p>
            </div>
          </div>
          <div style={{
            backgroundColor: theme.colors.pageBg, borderRadius: `0 0 ${theme.radii.lg} ${theme.radii.lg}`,
            padding: theme.spacing[4], border: `1px solid ${theme.colors.gray[200]}`, borderTop: 'none',
          }}>
            {renderCategory('preMajor', requirements.preMajor)}
            {renderCategory('prep', requirements.preparationForMajor)}
            {renderCategory('required', requirements.upperDivRequired)}
            {renderCategory('electives', requirements.upperDivElectives)}
          </div>
        </div>

        {/* Right: Quarter planner */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{
            backgroundColor: theme.colors.primary, color: 'white',
            padding: `${theme.spacing[4]} ${theme.spacing[5]}`, borderRadius: `${theme.radii.lg} ${theme.radii.lg} 0 0`,
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="3" width="16" height="14" rx="2" stroke="white" strokeWidth="1.5"/>
              <path d="M1 7h16M6 1v4M12 1v4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <h2 style={{ margin: 0, fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold, fontFamily: theme.typography.display }}>Quarter Planner</h2>
              <p style={{ margin: 0, fontSize: theme.typography.scale.xs, opacity: 0.8 }}>Your optimized schedule</p>
            </div>
          </div>
          <div style={{
            backgroundColor: theme.colors.pageBg, borderRadius: `0 0 ${theme.radii.lg} ${theme.radii.lg}`,
            padding: theme.spacing[4], border: `1px solid ${theme.colors.gray[200]}`, borderTop: 'none',
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', left: '16px', top: '20px', bottom: '60px',
                width: '2px', backgroundColor: theme.colors.gray[200],
              }} />
              {quarterPlan.map((quarter, index) => (
                <div key={quarter.quarter} style={{ display: 'flex', marginBottom: '20px', position: 'relative' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', zIndex: 1, flexShrink: 0,
                    backgroundColor: quarter.status === 'current' ? theme.colors.secondary : 'white',
                    border: `3px solid ${quarter.status === 'current' ? theme.colors.secondary : theme.colors.primary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '0.85rem', color: theme.colors.primary,
                  }}>
                    {index + 1}
                  </div>
                  <div style={{
                    flex: 1, marginLeft: '16px', backgroundColor: 'white',
                    borderRadius: theme.radii.lg, padding: theme.spacing[4],
                    boxShadow: quarter.status === 'current' ? theme.shadows.primary : theme.shadows.sm,
                    border: quarter.status === 'current' ? `2px solid ${theme.colors.secondary}` : `1px solid ${theme.colors.gray[200]}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600', color: theme.colors.primary }}>
                          {quarter.quarter}
                        </h3>
                        {quarter.status === 'current' && (
                          <span style={{
                            backgroundColor: theme.colors.secondary, color: theme.colors.primary,
                            padding: `2px ${theme.spacing[2]}`, borderRadius: theme.radii.sm, fontSize: theme.typography.scale.xs,
                            fontWeight: '700', marginTop: '4px', display: 'inline-block',
                          }}>CURRENT</span>
                        )}
                      </div>
                      <div style={{
                        backgroundColor: theme.colors.infoSurface, color: theme.colors.infoText,
                        padding: `${theme.spacing[1]} ${theme.spacing[3]}`, borderRadius: theme.radii.full,
                        fontSize: '0.75rem', fontWeight: '600',
                      }}>
                        {quarter.totalUnits} units
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {quarter.courses.map(course => (
                        <div key={course.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: `${theme.spacing[3]} ${theme.spacing[3]}`, borderRadius: theme.radii.md,
                          backgroundColor: theme.colors.gray[50], border: `1px solid ${theme.colors.gray[200]}`,
                        }}>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontWeight: '600', color: theme.colors.primary, fontSize: '0.9rem' }}>{course.id}</div>
                            <div style={{ fontSize: '0.75rem', color: theme.colors.gray[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {course.name}
                            </div>
                          </div>
                          <DifficultyBadge score={course.difficulty} size="small" />
                        </div>
                      ))}
                    </div>
                    <div style={{
                      marginTop: theme.spacing[3], padding: `${theme.spacing[2]} ${theme.spacing[3]}`, backgroundColor: theme.colors.gray[100],
                      borderRadius: theme.radii.sm, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span style={{ color: theme.colors.gray[600], fontSize: '0.75rem' }}>Average difficulty</span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: theme.colors.gray[200], borderRadius: theme.radii.full, overflow: 'hidden' }}>
                          <div style={{
                            width: `${(quarter.courses.reduce((s, c) => s + c.difficulty, 0) / (quarter.courses.length * 5)) * 100}%`,
                            height: '100%', backgroundColor: theme.colors.warning,
                          }} />
                        </div>
                        <span style={{ fontWeight: '600', color: theme.colors.gray[700], fontSize: '0.75rem' }}>
                          {(quarter.courses.reduce((s, c) => s + c.difficulty, 0) / quarter.courses.length).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: `2px dashed ${theme.colors.gray[300]}`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: theme.colors.gray[400], fontSize: theme.typography.scale.xl,
                    cursor: 'pointer', transition: `all ${theme.transitions.base}`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.primary; e.currentTarget.style.color = theme.colors.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[300]; e.currentTarget.style.color = theme.colors.gray[400]; }}
                >+</div>
                <span style={{ marginLeft: '16px', color: theme.colors.gray[500], fontSize: '0.85rem' }}>Add quarter...</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
