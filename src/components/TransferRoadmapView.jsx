import React, { useMemo } from 'react';
import { theme } from '../styles/theme.js';
import { IGETC_AREAS } from '../data/igetcAreas.js';
import { calculateIgetcProgress, mapCcCoursesToUcsbRequirements } from '../utils/transferUtils.js';
import { useIgetcMappings } from '../hooks/useIgetcMappings.js';
import { useInstitutions, useArticulations } from '../hooks/useArticulations.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';

// ---- Icon helpers ----

const CheckCircleIcon = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="8.25" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.12" />
    <path d="M5.5 9L7.75 11.25L12.5 6.5" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const HalfCircleIcon = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="8.25" stroke={color} strokeWidth="1.5" />
    <path d="M9 0.75 A8.25 8.25 0 0 1 9 17.25 Z" fill={color} fillOpacity="0.35" />
  </svg>
);

const EmptyCircleIcon = ({ color, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="9" cy="9" r="8.25" stroke={color} strokeWidth="1.5" />
  </svg>
);

// ---- Section card wrapper ----

const SectionCard = ({ children }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: theme.radii.lg,
    boxShadow: theme.shadows.sm,
    marginBottom: theme.spacing[6],
    overflow: 'hidden',
    border: `1px solid ${theme.colors.gray[200]}`,
  }}>
    {children}
  </div>
);

const SectionHeader = ({ title, subtitle }) => (
  <div style={{
    backgroundColor: theme.colors.primary,
    color: 'white',
    padding: `${theme.spacing[4]} ${theme.spacing[5]}`,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
  }}>
    <div>
      <h2 style={{
        margin: 0,
        fontSize: theme.typography.scale.lg,
        fontWeight: theme.typography.weight.semibold,
        fontFamily: theme.typography.display,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: theme.typography.scale.xs, opacity: 0.8 }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

// ---- Row renderer ----

const ChecklistRow = ({ statusIcon, leftContent, rightContent, isLast }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[3],
    padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
    borderBottom: isLast ? 'none' : `1px solid ${theme.colors.gray[100]}`,
  }}>
    {statusIcon}
    <div style={{ flex: 1, minWidth: 0 }}>
      {leftContent}
    </div>
    <div style={{ flexShrink: 0, textAlign: 'right' }}>
      {rightContent}
    </div>
  </div>
);

// ---- Pill badge for area IDs ----

const AreaPill = ({ label }) => (
  <span style={{
    display: 'inline-block',
    padding: `2px ${theme.spacing[2]}`,
    borderRadius: theme.radii.full,
    backgroundColor: theme.colors.primarySurface,
    color: theme.colors.primary,
    fontSize: theme.typography.scale.xs,
    fontWeight: theme.typography.weight.semibold,
    marginRight: theme.spacing[2],
    flexShrink: 0,
  }}>
    {label}
  </span>
);

// ---- Main component ----

export const TransferRoadmapView = ({ user }) => {
  const { articulations } = useArticulations(user?.source_institution_id ?? null);
  const { institutions } = useInstitutions();
  const institution = institutions.find(i => i.id === user?.source_institution_id);
  const { mappings: igetcMappings } = useIgetcMappings(institution?.short_name ?? null);

  const completedCcCourses = useMemo(
    () => (user?.transcript?.completed ?? []).map(c => c.course),
    [user]
  );
  const inProgressCcCourses = useMemo(
    () => (user?.transcript?.in_progress ?? []).map(c => c.course),
    [user]
  );

  const satisfiedIgetcAreas = useMemo(
    () => calculateIgetcProgress(completedCcCourses, igetcMappings),
    [completedCcCourses, igetcMappings]
  );

  const projectedIgetcAreas = useMemo(
    () => calculateIgetcProgress([...completedCcCourses, ...inProgressCcCourses], igetcMappings),
    [completedCcCourses, inProgressCcCourses, igetcMappings]
  );

  const majorRequirements = MAJOR_CONFIGS[user?.target_major_id]?.requirements ?? {};
  const satisfiedMajorCoursesArr = useMemo(
    () => mapCcCoursesToUcsbRequirements(completedCcCourses, articulations, majorRequirements),
    [completedCcCourses, articulations, majorRequirements]
  );
  const satisfiedMajorCourses = useMemo(
    () => new Set(satisfiedMajorCoursesArr),
    [satisfiedMajorCoursesArr]
  );

  const completedUnits = useMemo(
    () => (user?.transcript?.completed ?? []).reduce((sum, c) => sum + (c.units || 0), 0),
    [user]
  );
  const inProgressUnits = useMemo(
    () => (user?.transcript?.in_progress ?? []).reduce((sum, c) => sum + (c.units || 0), 0),
    [user]
  );

  // ---- Build IGETC rows ----
  const igetcRows = useMemo(() => {
    return IGETC_AREAS.map(area => {
      const satisfied = satisfiedIgetcAreas.has(area.id);
      const inProgress = !satisfied && projectedIgetcAreas.has(area.id);
      const satisfyingCourse = igetcMappings.find(
        m => m.igetc_area === area.id && completedCcCourses.includes(m.source_course_code)
      );
      const inProgressCourse = !satisfied
        ? igetcMappings.find(
            m => m.igetc_area === area.id && inProgressCcCourses.includes(m.source_course_code)
          )
        : null;
      return { area, satisfied, inProgress, satisfyingCourse, inProgressCourse };
    }).sort((a, b) => {
      const rankA = a.satisfied ? 0 : a.inProgress ? 1 : 2;
      const rankB = b.satisfied ? 0 : b.inProgress ? 1 : 2;
      if (rankA !== rankB) return rankA - rankB;
      return a.area.id.localeCompare(b.area.id);
    });
  }, [satisfiedIgetcAreas, projectedIgetcAreas, igetcMappings, completedCcCourses, inProgressCcCourses]);

  // ---- Build major lower-div rows ----
  const majorRows = useMemo(() => {
    const rows = [];
    for (const [sectionKey, section] of Object.entries(majorRequirements)) {
      const sectionCourses = (section.courses ?? []).map(course => {
        const satisfied = satisfiedMajorCourses.has(course.id);
        const satisfyingArt = articulations.find(
          art =>
            art.articulation_type === 'equivalent' &&
            art.target_course?.course_id_clean === course.id &&
            completedCcCourses.includes(art.source_course_code)
        );
        return { course, satisfied, satisfyingCcCode: satisfyingArt?.source_course_code ?? null, sectionName: section.name };
      });
      rows.push(...sectionCourses);
    }
    return rows.sort((a, b) => {
      if (a.satisfied !== b.satisfied) return a.satisfied ? -1 : 1;
      return a.course.id.localeCompare(b.course.id);
    });
  }, [majorRequirements, satisfiedMajorCourses, articulations, completedCcCourses]);

  // Group major rows by section for display
  const majorSections = useMemo(() => {
    const map = new Map();
    for (const row of majorRows) {
      if (!map.has(row.sectionName)) map.set(row.sectionName, []);
      map.get(row.sectionName).push(row);
    }
    return map;
  }, [majorRows]);

  const majorName = MAJOR_CONFIGS[user?.target_major_id]?.name ?? 'Target Major';
  const institutionName = institution?.name ?? 'your institution';
  const totalProjected = completedUnits + inProgressUnits;
  const progressPct = Math.min((totalProjected / 60) * 100, 100);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: theme.spacing[6] }}>
        <h1 style={{
          fontSize: theme.typography.scale['3xl'],
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.primary,
          margin: `0 0 ${theme.spacing[2]} 0`,
          fontFamily: theme.typography.display,
        }}>
          Transfer Roadmap
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          {institution ? `${institution.name} \u2192 UCSB ${majorName}` : `Transfer checklist for ${majorName}`}
        </p>
      </div>

      {/* Section 1: IGETC General Education */}
      <SectionCard>
        <SectionHeader
          title="IGETC General Education Requirements"
          subtitle={`${satisfiedIgetcAreas.size} of ${IGETC_AREAS.length} areas satisfied`}
        />
        <div>
          {igetcRows.map((row, idx) => {
            const { area, satisfied, inProgress, satisfyingCourse, inProgressCourse } = row;
            const isLast = idx === igetcRows.length - 1;

            let statusIcon;
            if (satisfied) {
              statusIcon = <CheckCircleIcon color={theme.colors.successActive} />;
            } else if (inProgress) {
              statusIcon = <HalfCircleIcon color={theme.colors.info} />;
            } else {
              statusIcon = <EmptyCircleIcon color={theme.colors.gray[300]} />;
            }

            const leftContent = (
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
                <AreaPill label={area.id} />
                <span style={{
                  fontSize: theme.typography.scale.sm,
                  color: satisfied ? theme.colors.gray[800] : theme.colors.gray[600],
                  fontWeight: satisfied ? theme.typography.weight.medium : theme.typography.weight.normal,
                }}>
                  {area.label}
                </span>
              </div>
            );

            let rightContent = null;
            if (satisfied && satisfyingCourse) {
              rightContent = (
                <span style={{
                  fontSize: theme.typography.scale.xs,
                  fontWeight: theme.typography.weight.semibold,
                  color: theme.colors.successActive,
                  backgroundColor: theme.colors.successSurfaceLight,
                  padding: `2px ${theme.spacing[2]}`,
                  borderRadius: theme.radii.sm,
                }}>
                  {satisfyingCourse.source_course_code}
                </span>
              );
            } else if (inProgress && inProgressCourse) {
              rightContent = (
                <span style={{
                  fontSize: theme.typography.scale.xs,
                  color: theme.colors.infoText,
                  backgroundColor: theme.colors.infoSurfaceLight,
                  padding: `2px ${theme.spacing[2]}`,
                  borderRadius: theme.radii.sm,
                }}>
                  {inProgressCourse.source_course_code} (in progress)
                </span>
              );
            }

            return (
              <ChecklistRow
                key={area.id}
                statusIcon={statusIcon}
                leftContent={leftContent}
                rightContent={rightContent}
                isLast={isLast}
              />
            );
          })}
        </div>
      </SectionCard>

      {/* Section 2: Major Lower-Division Requirements */}
      <SectionCard>
        <SectionHeader
          title={`Lower-Division Requirements \u2014 ${majorName}`}
          subtitle={
            articulations.length > 0
              ? `${satisfiedMajorCourses.size} of ${majorRows.length} courses satisfied`
              : undefined
          }
        />
        {articulations.length === 0 ? (
          <div style={{
            padding: theme.spacing[6],
            color: theme.colors.gray[600],
            fontSize: theme.typography.scale.sm,
            lineHeight: theme.typography.lineHeight.relaxed,
          }}>
            No articulation data on file for {institutionName} \u00d7 {majorName}. These requirements may still be
            transferable \u2014 check with your counselor.
          </div>
        ) : (
          <div>
            {majorRows.length === 0 ? (
              <div style={{ padding: theme.spacing[6], color: theme.colors.gray[500], fontSize: theme.typography.scale.sm }}>
                No lower-division requirements found for this major.
              </div>
            ) : (
              Array.from(majorSections.entries()).map(([sectionName, sectionRows]) => (
                <div key={sectionName}>
                  {/* Sub-heading */}
                  <div style={{
                    padding: `${theme.spacing[2]} ${theme.spacing[5]}`,
                    backgroundColor: theme.colors.gray[50],
                    borderBottom: `1px solid ${theme.colors.gray[200]}`,
                    borderTop: `1px solid ${theme.colors.gray[200]}`,
                    fontSize: theme.typography.scale.xs,
                    fontWeight: theme.typography.weight.semibold,
                    color: theme.colors.gray[500],
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    {sectionName}
                  </div>
                  {sectionRows.map((row, idx) => {
                    const { course, satisfied, satisfyingCcCode } = row;
                    const isLast = idx === sectionRows.length - 1;

                    const statusIcon = satisfied
                      ? <CheckCircleIcon color={theme.colors.successActive} />
                      : <EmptyCircleIcon color={theme.colors.gray[300]} />;

                    const leftContent = (
                      <div>
                        <span style={{
                          fontSize: theme.typography.scale.sm,
                          fontWeight: theme.typography.weight.semibold,
                          color: satisfied ? theme.colors.gray[800] : theme.colors.gray[700],
                          marginRight: theme.spacing[2],
                        }}>
                          {course.id}
                        </span>
                        {course.name && (
                          <span style={{
                            fontSize: theme.typography.scale.xs,
                            color: theme.colors.gray[500],
                          }}>
                            {course.name}
                          </span>
                        )}
                      </div>
                    );

                    const rightContent = satisfied && satisfyingCcCode ? (
                      <span style={{
                        fontSize: theme.typography.scale.xs,
                        fontWeight: theme.typography.weight.semibold,
                        color: theme.colors.successActive,
                        backgroundColor: theme.colors.successSurfaceLight,
                        padding: `2px ${theme.spacing[2]}`,
                        borderRadius: theme.radii.sm,
                      }}>
                        Satisfied by {satisfyingCcCode}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: theme.typography.scale.xs,
                        color: theme.colors.gray[400],
                      }}>
                        Not satisfied
                      </span>
                    );

                    return (
                      <ChecklistRow
                        key={course.id}
                        statusIcon={statusIcon}
                        leftContent={leftContent}
                        rightContent={rightContent}
                        isLast={isLast}
                      />
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </SectionCard>

      {/* Section 3: Unit Summary */}
      <SectionCard>
        <SectionHeader
          title="Unit Progress toward Transfer"
          subtitle="California community colleges require 60 transferable units"
        />
        <div style={{ padding: theme.spacing[6] }}>
          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: theme.spacing[6],
            marginBottom: theme.spacing[5],
            flexWrap: 'wrap',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.scale['2xl'],
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.successActive,
              }}>
                {completedUnits}
              </div>
              <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginTop: '2px' }}>
                units completed
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.scale['2xl'],
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.info,
              }}>
                {inProgressUnits}
              </div>
              <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginTop: '2px' }}>
                units in progress
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: theme.typography.scale['2xl'],
                fontWeight: theme.typography.weight.bold,
                color: theme.colors.primary,
              }}>
                {totalProjected} / 60
              </div>
              <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginTop: '2px' }}>
                projected total
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{
            height: '12px',
            backgroundColor: theme.colors.gray[200],
            borderRadius: theme.radii.full,
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${progressPct}%`,
              height: '100%',
              backgroundColor: totalProjected >= 60 ? theme.colors.successActive : theme.colors.primary,
              borderRadius: theme.radii.full,
              transition: `width ${theme.transitions.slow}`,
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: theme.spacing[2],
            fontSize: theme.typography.scale.xs,
            color: theme.colors.gray[400],
          }}>
            <span>0</span>
            <span style={{ color: totalProjected >= 60 ? theme.colors.successActive : theme.colors.gray[600], fontWeight: theme.typography.weight.medium }}>
              {Math.round(progressPct)}% complete
            </span>
            <span>60</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
};
