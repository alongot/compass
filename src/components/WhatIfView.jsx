import React, { useState } from 'react';
import { theme } from '../styles/theme.js';
import { MAJOR_CONFIGS } from '../data/demo/majorConfigs.js';
import { buildUserRequirements } from '../utils/requirementsUtils.js';
import { StatusBadge } from './shared/StatusBadge.jsx';
import { ProgressRing } from './shared/ProgressRing.jsx';
import { TransferWhatIfView } from './TransferWhatIfView.jsx';

export const WhatIfView = ({ user, requirements }) => {
  const [selectedMajor, setSelectedMajor] = useState('ECON');

  if (user?.student_type === 'transfer') {
    return <TransferWhatIfView user={user} />;
  }

  // Compute ECON remaining dynamically from requirements
  const allReqCourses = Object.values(requirements).flatMap(cat => cat.courses || []);
  const completedReqUnits = allReqCourses
    .filter(c => c.status === 'completed')
    .reduce((sum, c) => sum + c.units, 0);
  const totalReqUnits = allReqCourses.reduce((sum, c) => sum + c.units, 0);

  // Total completed units from transcript (includes non-major courses)
  const transcriptUnits = user?.transcript?.completed
    ? user.transcript.completed.reduce((sum, c) => sum + (c.units || 0), 0)
    : completedReqUnits;
  const completedUnits = Math.max(transcriptUnits, completedReqUnits);

  const totalDegreeUnits = 120;
  const econRemaining = Math.max(0, totalDegreeUnits - completedUnits);
  const econQuarters = Math.max(1, Math.ceil(econRemaining / 16));

  // For other majors, estimate transfer ratios (how much of completed work applies)
  const commTransferRatio = 0.75;
  const socTransferRatio = 0.85;
  const pstatTransferRatio = 0.55;
  const commRemaining = Math.max(0, totalDegreeUnits - Math.round(completedUnits * commTransferRatio));
  const socRemaining = Math.max(0, totalDegreeUnits - Math.round(completedUnits * socTransferRatio));
  const pstatRemaining = Math.max(0, totalDegreeUnits - Math.round(completedUnits * pstatTransferRatio));

  const majors = [
    { code: 'ECON', name: 'Economics B.A.', remaining: econRemaining, quarters: econQuarters },
    { code: 'COMM', name: 'Communication B.A.', remaining: commRemaining, quarters: Math.max(1, Math.ceil(commRemaining / 16)) },
    { code: 'SOC', name: 'Sociology B.A.', remaining: socRemaining, quarters: Math.max(1, Math.ceil(socRemaining / 16)) },
    { code: 'PSTAT', name: 'Statistics B.S.', remaining: pstatRemaining, quarters: Math.max(1, Math.ceil(pstatRemaining / 16)) },
  ];

  return (
    <div>
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{ fontSize: theme.typography.scale['3xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary, margin: '0 0 8px 0', fontFamily: theme.typography.display }}>
          What-If Analysis
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          See how your progress changes if you switch majors
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: theme.spacing[6] }}>
        {majors.map(major => (
          <div
            key={major.code}
            onClick={() => setSelectedMajor(major.code)}
            style={{
              backgroundColor: 'white',
              borderRadius: theme.radii.lg,
              padding: theme.spacing[6],
              boxShadow: theme.shadows.sm,
              border: selectedMajor === major.code ? `2px solid ${theme.colors.secondary}` : '2px solid transparent',
              cursor: 'pointer',
              transition: `all ${theme.transitions.base}`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: theme.spacing[4] }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold, color: theme.colors.primary }}>
                  {major.name}
                </h3>
                {major.code === 'ECON' && (
                  <span style={{
                    backgroundColor: theme.colors.successSurface,
                    color: theme.colors.successText,
                    padding: `2px ${theme.spacing[2]}`,
                    borderRadius: theme.radii.sm,
                    fontSize: theme.typography.scale.xs,
                    fontWeight: theme.typography.weight.semibold,
                  }}>
                    Current Major
                  </span>
                )}
              </div>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: theme.radii.full,
                border: `2px solid ${selectedMajor === major.code ? theme.colors.secondary : theme.colors.gray[300]}`,
                backgroundColor: selectedMajor === major.code ? theme.colors.secondary : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {selectedMajor === major.code && (
                  <div style={{ width: '8px', height: '8px', borderRadius: theme.radii.full, backgroundColor: 'white' }} />
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing[4] }}>
              <div>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginBottom: theme.spacing[1] }}>
                  Remaining Units
                </div>
                <div style={{ fontSize: theme.typography.scale['2xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary }}>
                  {major.remaining}
                </div>
              </div>
              <div>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginBottom: theme.spacing[1] }}>
                  Est. Quarters
                </div>
                <div style={{ fontSize: theme.typography.scale['2xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary }}>
                  {major.quarters}
                </div>
              </div>
            </div>

            <div style={{ marginTop: theme.spacing[4] }}>
              <div style={{
                height: '8px',
                backgroundColor: theme.colors.gray[200],
                borderRadius: theme.radii.full,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${((120 - major.remaining) / 120) * 100}%`,
                  height: '100%',
                  backgroundColor: major.code === 'ECON' ? theme.colors.success : theme.colors.warning,
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: theme.spacing[1] }}>
                <span style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500] }}>
                  {Math.round(((120 - major.remaining) / 120) * 100)}% complete
                </span>
                <span style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500] }}>
                  {120 - major.remaining} units earned
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(() => {
        const selected = majors.find(m => m.code === selectedMajor);
        const econData = majors.find(m => m.code === 'ECON');
        if (!selected || selectedMajor === 'ECON') {
          return (
            <div style={{
              marginTop: theme.spacing[8],
              backgroundColor: theme.colors.successSurface,
              borderRadius: theme.radii.lg,
              padding: theme.spacing[6],
              border: `1px solid ${theme.colors.successBorder}`,
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: theme.colors.successText, fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold }}>
                Current Major: Economics B.A.
              </h3>
              <p style={{ margin: 0, color: theme.colors.successText, fontSize: theme.typography.scale.sm }}>
                You have {totalDegreeUnits - econRemaining} units completed with {econRemaining} remaining ({econQuarters} quarter{econQuarters !== 1 ? 's' : ''} to go).
              </p>
            </div>
          );
        }
        const transferUnits = totalDegreeUnits - selected.remaining;
        const transferCourses = Math.round(transferUnits / 4);
        const newReqUnits = selected.remaining - econData.remaining;
        const newReqCourses = Math.max(0, Math.round(newReqUnits / 4));
        const quarterDiff = selected.quarters - econData.quarters;
        return (
          <div style={{
            marginTop: theme.spacing[8],
            backgroundColor: theme.colors.infoSurfaceLight,
            borderRadius: theme.radii.lg,
            padding: theme.spacing[6],
            border: `1px solid ${theme.colors.infoBorderLight}`,
          }}>
            <h3 style={{ margin: `0 0 ${theme.spacing[3]} 0`, color: theme.colors.infoText, fontSize: theme.typography.scale.lg, fontWeight: theme.typography.weight.semibold }}>
              Switching from Economics to {selected.name}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[4] }}>
              <div style={{ padding: theme.spacing[4], backgroundColor: 'white', borderRadius: theme.radii.md }}>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginBottom: theme.spacing[1] }}>
                  Courses that transfer
                </div>
                <div style={{ fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.bold, color: theme.colors.successEmphasis }}>{transferCourses} courses</div>
                <div style={{ fontSize: theme.typography.scale.sm, color: theme.colors.gray[600] }}>{transferUnits} units</div>
              </div>
              <div style={{ padding: theme.spacing[4], backgroundColor: 'white', borderRadius: theme.radii.md }}>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginBottom: theme.spacing[1] }}>
                  Additional requirements
                </div>
                <div style={{ fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.bold, color: theme.colors.dangerEmphasis }}>{newReqCourses > 0 ? `${newReqCourses} courses` : 'None'}</div>
                <div style={{ fontSize: theme.typography.scale.sm, color: theme.colors.gray[600] }}>{newReqUnits > 0 ? `${newReqUnits} units` : 'Fewer units needed'}</div>
              </div>
              <div style={{ padding: theme.spacing[4], backgroundColor: 'white', borderRadius: theme.radii.md }}>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500], marginBottom: theme.spacing[1] }}>
                  Time impact
                </div>
                <div style={{ fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.bold, color: quarterDiff > 0 ? theme.colors.warning : theme.colors.successEmphasis }}>
                  {quarterDiff > 0 ? `+${quarterDiff}` : quarterDiff} quarter{Math.abs(quarterDiff) !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: theme.typography.scale.sm, color: theme.colors.gray[600] }}>vs current plan</div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
