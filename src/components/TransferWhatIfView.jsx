import React, { useMemo, useState } from 'react';
import { theme } from '../styles/theme.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';
import { useArticulations } from '../hooks/useArticulations.js';
import { mapCcCoursesToUcsbRequirements } from '../utils/transferUtils.js';

export const TransferWhatIfView = ({ user }) => {
  const [dismissedNote, setDismissedNote] = useState(false);

  const { articulations } = useArticulations(user?.source_institution_id ?? null);

  const completedCcCourses = useMemo(
    () => (user?.transcript?.completed ?? []).map(c => c.course),
    [user]
  );
  const inProgressCcCourses = useMemo(
    () => (user?.transcript?.in_progress ?? []).map(c => c.course),
    [user]
  );
  const allCcCourses = useMemo(
    () => [...completedCcCourses, ...inProgressCcCourses],
    [completedCcCourses, inProgressCcCourses]
  );

  const totalUnits = useMemo(
    () => [
      ...(user?.transcript?.completed ?? []),
      ...(user?.transcript?.in_progress ?? []),
    ].reduce((sum, c) => sum + (c.units || 0), 0),
    [user]
  );
  const unitGapTo60 = Math.max(0, 60 - totalUnits);

  const majorCards = useMemo(() => {
    return Object.entries(MAJOR_CONFIGS).map(([majorId, majorData]) => {
      const requirements = majorData.requirements ?? {};
      const satisfiedIds = mapCcCoursesToUcsbRequirements(allCcCourses, articulations, requirements);
      const satisfiedSet = new Set(satisfiedIds);

      // Count total lower-div requirement courses across all sections
      const totalCount = Object.values(requirements).reduce(
        (sum, section) => sum + (section.courses ?? []).length,
        0
      );

      // Count how many of the satisfied UCSB IDs appear in this major's requirements
      const allRequiredIds = new Set(
        Object.values(requirements).flatMap(section => (section.courses ?? []).map(c => c.id))
      );
      const satisfiedCount = [...satisfiedSet].filter(id => allRequiredIds.has(id)).length;

      const percentSatisfied = totalCount > 0
        ? Math.round((satisfiedCount / totalCount) * 100)
        : 0;

      return {
        majorId,
        majorName: majorData.name,
        isCurrentTarget: majorId === user?.target_major_id,
        satisfiedCount,
        totalCount,
        percentSatisfied,
        unitGapTo60,
      };
    }).sort((a, b) => b.percentSatisfied - a.percentSatisfied);
  }, [allCcCourses, articulations, user, unitGapTo60]);

  const noArticulationData = articulations.length === 0;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{
          fontSize: theme.typography.scale['3xl'],
          fontWeight: theme.typography.weight.bold,
          color: theme.colors.primary,
          margin: '0 0 8px 0',
          fontFamily: theme.typography.display,
        }}>
          What-If: Which UCSB Major Fits My CC Coursework?
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          IGETC progress is independent of your target major — it stays the same across all comparisons below.
        </p>
      </div>

      {/* No articulation data banner */}
      {noArticulationData && !dismissedNote && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: theme.colors.warningSurface,
          border: `1px solid ${theme.colors.warningBorder}`,
          borderRadius: theme.radii.md,
          padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
          marginBottom: theme.spacing[6],
        }}>
          <span style={{ fontSize: theme.typography.scale.sm, color: theme.colors.warningText }}>
            Articulation data unavailable. Results will update once data loads.
          </span>
          <button
            onClick={() => setDismissedNote(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: theme.colors.warningText,
              fontWeight: theme.typography.weight.semibold,
              fontSize: theme.typography.scale.sm,
              padding: `0 ${theme.spacing[1]}`,
            }}
            aria-label="Dismiss"
          >
            x
          </button>
        </div>
      )}

      {/* Major cards grid */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing[4],
      }}>
        {majorCards.map(card => {
          const {
            majorId,
            majorName,
            isCurrentTarget,
            satisfiedCount,
            totalCount,
            percentSatisfied,
          } = card;

          const percentColor = percentSatisfied > 50
            ? theme.colors.successActive
            : percentSatisfied > 20
              ? theme.colors.secondary
              : theme.colors.gray[400];

          return (
            <div
              key={majorId}
              style={{
                flex: '1 1 280px',
                maxWidth: '340px',
                border: isCurrentTarget
                  ? `2px solid ${theme.colors.primary}`
                  : `1px solid ${theme.colors.gray[200]}`,
                borderRadius: theme.spacing[3],
                padding: theme.spacing[4],
                backgroundColor: 'white',
                position: 'relative',
              }}
            >
              {isCurrentTarget && (
                <span style={{
                  position: 'absolute',
                  top: theme.spacing[2],
                  right: theme.spacing[2],
                  backgroundColor: theme.colors.primary,
                  color: 'white',
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '99px',
                }}>
                  Current Target
                </span>
              )}

              <h3 style={{
                marginTop: 0,
                marginBottom: theme.spacing[2],
                marginRight: isCurrentTarget ? theme.spacing[16] : 0,
                fontSize: theme.typography.scale.base,
                fontWeight: theme.typography.weight.semibold,
                color: theme.colors.primary,
              }}>
                {majorName}
              </h3>

              <div style={{
                fontSize: '32px',
                fontWeight: theme.typography.weight.bold,
                color: percentColor,
                lineHeight: '1',
                marginBottom: theme.spacing[1],
              }}>
                {percentSatisfied}%
              </div>

              <div style={{ color: theme.colors.gray[400], fontSize: '13px', marginBottom: theme.spacing[2] }}>
                {satisfiedCount} of {totalCount} lower-div requirements satisfied
              </div>

              <div style={{ marginTop: theme.spacing[2], fontSize: '13px', color: theme.colors.gray[600] }}>
                Unit gap to 60: <strong>{unitGapTo60}</strong>
              </div>

              <div style={{
                fontSize: '11px',
                color: theme.colors.gray[400],
                marginTop: theme.spacing[1],
              }}>
                IGETC delta: 0
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
