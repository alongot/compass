import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../../styles/theme.js';

export const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = options.filter(o =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  if (value) {
    return (
      <div
        onClick={() => { onChange(null); setQuery(''); setIsOpen(true); }}
        style={{
          padding: '14px 16px',
          borderRadius: theme.radii.lg,
          border: `2px solid ${theme.colors.success}`,
          backgroundColor: theme.colors.successSurfaceLight,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '1rem',
        }}
      >
        <span style={{ fontWeight: '600', color: theme.colors.successText }}>{value.name}</span>
        <span style={{ color: theme.colors.success, fontWeight: '700', fontSize: '1.1rem' }}>✓</span>
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '14px 16px',
          borderRadius: theme.radii.lg,
          border: `2px solid ${theme.colors.gray[200]}`,
          fontSize: '1rem',
          outline: 'none',
          boxSizing: 'border-box',
          transition: `border-color ${theme.transitions.base}`,
        }}
        onMouseEnter={e => e.target.style.borderColor = theme.colors.primary}
        onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = theme.colors.gray[200]; }}
      />
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          borderRadius: theme.radii.lg,
          border: `1px solid ${theme.colors.gray[200]}`,
          boxShadow: theme.shadows.md,
          zIndex: 10,
          maxHeight: '200px',
          overflowY: 'auto',
        }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '16px', color: theme.colors.gray[400], textAlign: 'center', fontSize: '0.9rem' }}>
              No results found
            </div>
          ) : (
            filtered.map(option => (
              <div
                key={option.id}
                onClick={() => { onChange(option); setIsOpen(false); setQuery(''); }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: `background-color ${theme.transitions.fast}`,
                  fontSize: '0.95rem',
                  color: theme.colors.gray[700],
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.colors.gray[100]}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
              >
                {option.name}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
