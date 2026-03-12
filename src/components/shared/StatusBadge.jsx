import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    completed: { bg: '#d1fae5', color: '#065f46', text: 'Completed' },
    in_progress: { bg: '#dbeafe', color: '#1e40af', text: 'In Progress' },
    planned: { bg: '#fef3c7', color: '#92400e', text: 'Planned' },
    not_started: { bg: '#f3f4f6', color: '#6b7280', text: 'Not Started' },
  };
  const style = styles[status] || styles.not_started;

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      backgroundColor: style.bg,
      color: style.color,
    }}>
      {style.text}
    </span>
  );
};
