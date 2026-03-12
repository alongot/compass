import React from 'react';
import { theme } from '../styles/theme.js';
import { StatusBadge } from './shared/StatusBadge.jsx';
import { DifficultyBadge } from './shared/DifficultyBadge.jsx';
import { ProgressRing } from './shared/ProgressRing.jsx';

export const RequirementsView = ({ requirements, majorName }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '\u2713';
      case 'in_progress': return '\u25D0';
      case 'planned': return '\u25CB';
      default: return '\u25CB';
    }
  };

  const renderCategory = (key, category) => {
    const completed = category.courses.filter(c => c.status === 'completed').length;
    const total = category.courses.length;
    const completedUnits = category.courses
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.units, 0);

    return (
      <div key={key} style={{
        backgroundColor: 'white',
        borderRadius: theme.radii.lg,
        padding: theme.spacing[6],
        marginBottom: theme.spacing[6],
        boxShadow: theme.shadows.sm,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing[5] }}>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: theme.typography.scale.xl, fontWeight: theme.typography.weight.semibold, color: theme.colors.primary, fontFamily: theme.typography.display }}>
              {category.name}
            </h2>
            <p style={{ margin: 0, color: theme.colors.gray[500], fontSize: theme.typography.scale.sm }}>
              {completed} of {total} courses completed ({completedUnits}/{category.units} units)
            </p>
          </div>
          <div style={{ width: '120px' }}>
            <div style={{
              height: '8px',
              backgroundColor: theme.colors.gray[200],
              borderRadius: theme.radii.full,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${(completed/total)*100}%`,
                height: '100%',
                backgroundColor: theme.colors.success,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        </div>

        <div>
          {category.courses.map(course => (
            <div key={course.id} style={{
              display: 'flex',
              alignItems: 'center',
              padding: theme.spacing[4],
              borderRadius: theme.radii.md,
              backgroundColor: course.status === 'completed' ? theme.colors.successSurfaceLight :
                             course.status === 'in_progress' ? theme.colors.infoSurfaceLight : theme.colors.surface,
              marginBottom: theme.spacing[2],
              border: `1px solid ${course.status === 'completed' ? theme.colors.successBorderLight :
                      course.status === 'in_progress' ? theme.colors.infoBorderLight : theme.colors.gray[200]}`,
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: theme.radii.full,
                backgroundColor: course.status === 'completed' ? theme.colors.success :
                               course.status === 'in_progress' ? theme.colors.info : theme.colors.gray[200],
                color: course.status === 'completed' || course.status === 'in_progress' ? 'white' : theme.colors.gray[400],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: theme.typography.weight.bold,
                marginRight: theme.spacing[4],
              }}>
                {getStatusIcon(course.status)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing[2] }}>
                  <span style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[800] }}>{course.id}</span>
                  {course.grade && (
                    <span style={{
                      backgroundColor: theme.colors.successSurface,
                      color: theme.colors.successText,
                      padding: `2px ${theme.spacing[2]}`,
                      borderRadius: theme.radii.sm,
                      fontSize: theme.typography.scale.xs,
                      fontWeight: theme.typography.weight.semibold,
                    }}>
                      {course.grade}
                    </span>
                  )}
                </div>
                <div style={{ color: theme.colors.gray[500], fontSize: theme.typography.scale.sm }}>{course.name}</div>
              </div>
              <div style={{ marginRight: theme.spacing[4], textAlign: 'right' }}>
                <div style={{ fontSize: theme.typography.scale.xs, color: theme.colors.gray[500] }}>Units</div>
                <div style={{ fontWeight: theme.typography.weight.semibold, color: theme.colors.gray[700] }}>{course.units}</div>
              </div>
              <DifficultyBadge score={course.difficulty} size="small" />
              <div style={{ marginLeft: theme.spacing[4] }}>
                <StatusBadge status={course.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: theme.spacing[8] }}>
        <h1 style={{ fontSize: theme.typography.scale['3xl'], fontWeight: theme.typography.weight.bold, color: theme.colors.primary, margin: '0 0 8px 0', fontFamily: theme.typography.display }}>
          {majorName || 'Major'} Requirements
        </h1>
        <p style={{ color: theme.colors.gray[500], margin: 0 }}>
          Track your progress through major requirements
        </p>
      </div>

      {renderCategory('preMajor', requirements.preMajor)}
      {renderCategory('prep', requirements.preparationForMajor)}
      {renderCategory('required', requirements.upperDivRequired)}
      {renderCategory('electives', requirements.upperDivElectives)}
    </div>
  );
};
