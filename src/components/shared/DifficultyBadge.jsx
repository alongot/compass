import React from 'react';

export const DifficultyBadge = ({ score, size = 'normal' }) => {
  const getColor = (score) => {
    if (score <= 2) return { bg: '#d1fae5', text: '#065f46', label: 'Easy' };
    if (score <= 3.5) return { bg: '#fef3c7', text: '#92400e', label: 'Moderate' };
    return { bg: '#ffedd5', text: '#9a3412', label: 'Challenging' };
  };
  const color = getColor(score);
  const isSmall = size === 'small';

  return (
    <div style={{
      backgroundColor: color.bg,
      color: color.text,
      padding: isSmall ? '2px 8px' : '4px 12px',
      borderRadius: '8px',
      textAlign: 'center',
      minWidth: isSmall ? '40px' : '60px',
    }}>
      <div style={{ fontWeight: '700', fontSize: isSmall ? '0.875rem' : '1rem' }}>{score}</div>
      {!isSmall && <div style={{ fontSize: '0.6rem', textTransform: 'uppercase' }}>{color.label}</div>}
    </div>
  );
};
