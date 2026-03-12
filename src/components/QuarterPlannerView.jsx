import React, { useState } from 'react';
import { theme } from '../styles/theme.js';
import { DifficultyBadge } from './shared/DifficultyBadge.jsx';

export const QuarterPlannerView = ({ quarterPlan }) => {
  return (
    <div>
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{ fontSize: theme.typography.scale['3xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary, margin: '0 0 8px 0', fontFamily: theme.typography.display }}>
          Quarter Planner
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          Your optimized course roadmap based on prerequisites and difficulty balance
        </p>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '20px',
          top: '0',
          bottom: '0',
          width: '2px',
          backgroundColor: theme.colors.gray[200],
        }} />

        {quarterPlan.map((quarter, index) => (
          <div key={quarter.quarter} style={{
            display: 'flex',
            marginBottom: theme.spacing[8],
            position: 'relative',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: theme.radii.full,
              backgroundColor: quarter.status === 'current' ? theme.colors.secondary : 'white',
              border: `3px solid ${quarter.status === 'current' ? theme.colors.secondary : theme.colors.primary}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: theme.typography.weight.bold,
              color: theme.colors.primary,
              zIndex: 1,
              flexShrink: 0,
            }}>
              {index + 1}
            </div>

            <div style={{
              flex: 1,
              marginLeft: theme.spacing[6],
              backgroundColor: 'white',
              borderRadius: theme.radii.lg,
              padding: theme.spacing[6],
              boxShadow: quarter.status === 'current' ? theme.shadows.primary : theme.shadows.sm,
              border: quarter.status === 'current' ? `2px solid ${theme.colors.secondary}` : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[4] }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.semibold, color: theme.colors.primary }}>
                    {quarter.quarter}
                  </h3>
                  {quarter.status === 'current' && (
                    <span style={{
                      backgroundColor: theme.colors.secondary,
                      color: theme.colors.primary,
                      padding: `2px ${theme.spacing[2]}`,
                      borderRadius: theme.radii.sm,
                      fontSize: theme.typography.scale.xs,
                      fontWeight: theme.typography.weight.bold,
                      marginTop: theme.spacing[1],
                      display: 'inline-block',
                    }}>
                      CURRENT
                    </span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500] }}>Total Units</div>
                  <div style={{ fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.bold, color: theme.colors.primary }}>
                    {quarter.totalUnits}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: theme.spacing[3] }}>
                {quarter.courses.map(course => (
                  <div key={course.id} style={{
                    padding: theme.spacing[4],
                    borderRadius: theme.radii.lg,
                    backgroundColor: theme.colors.gray[50],
                    border: `1px solid ${theme.colors.gray[200]}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: theme.spacing[2] }}>
                      <div style={{ fontWeight: theme.typography.weight.bold, color: theme.colors.primary }}>{course.id}</div>
                      <DifficultyBadge score={course.difficulty} size="small" />
                    </div>
                    <div style={{ fontSize: theme.typography.scale.sm, color: theme.colors.gray[600] }}>{course.name}</div>
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: theme.spacing[4],
                padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
                backgroundColor: theme.colors.gray[100],
                borderRadius: theme.radii.md,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ color: theme.colors.gray[600], fontSize: theme.typography.scale.sm }}>
                  Quarter difficulty balance
                </span>
                <div style={{ display: 'flex', gap: theme.spacing[2], alignItems: 'center' }}>
                  <div style={{ width: '100px', height: '8px', backgroundColor: theme.colors.gray[200], borderRadius: theme.radii.full, overflow: 'hidden' }}>
                    <div style={{
                      width: `${(quarter.courses.reduce((sum, c) => sum + c.difficulty, 0) / (quarter.courses.length * 5)) * 100}%`,
                      height: '100%',
                      backgroundColor: theme.colors.warning,
                    }} />
                  </div>
                  <span style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[700], fontSize: theme.typography.scale.sm }}>
                    {(quarter.courses.reduce((sum, c) => sum + c.difficulty, 0) / quarter.courses.length).toFixed(1)} avg
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '0' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: theme.radii.full,
            border: `2px dashed ${theme.colors.gray[300]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.gray[400],
            fontSize: theme.typography.scale.xl,
            cursor: 'pointer',
          }}>
            +
          </div>
          <span style={{ marginLeft: theme.spacing[6], color: theme.colors.gray[500] }}>
            Add another quarter...
          </span>
        </div>
      </div>
    </div>
  );
};
