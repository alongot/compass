import React from 'react';
import { theme } from '../../styles/theme.js';

export const ProgressRing = ({ progress, size = 120, strokeWidth = 10, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.gray[200]}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={theme.colors.secondary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: theme.typography.scale['2xl'], fontWeight: theme.typography.weight.extrabold, color: theme.colors.primary, fontFamily: theme.typography.display }}>{progress}%</div>
        <div style={{ fontSize: '0.7rem', color: theme.colors.gray[500], textTransform: 'uppercase' }}>{label}</div>
      </div>
    </div>
  );
};
