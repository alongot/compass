import React, { useState } from 'react';
import { theme } from '../styles/theme.js';

export const LoginScreen = ({ users, onSelectUser, onCreateNew }) => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.colors.pageBg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: theme.typography.body,
      padding: '32px',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          color: theme.colors.primary,
          fontSize: '2.5rem',
          fontWeight: '800',
          fontFamily: theme.typography.display,
          margin: 0,
        }}>
          Compass
        </h1>
        <p style={{ color: theme.colors.secondary, fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '600' }}>
          UCSB Academic Planner
        </p>
      </div>

      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: theme.radii.xl,
        padding: theme.spacing[10],
        boxShadow: theme.shadows.lg,
      }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: theme.colors.primary, fontWeight: '700' }}>
          Welcome back
        </h2>
        <p style={{ margin: '0 0 28px 0', color: theme.colors.gray[500], fontSize: '0.9rem' }}>
          Select your profile to continue
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {users.map(user => (
            <div
              key={user.id}
              onClick={() => onSelectUser(user)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${theme.colors.gray[200]}`,
                cursor: 'pointer',
                transition: `all ${theme.transitions.base}`,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = theme.colors.secondary; e.currentTarget.style.backgroundColor = theme.colors.warningSurfaceLight; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = theme.colors.gray[200]; e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: theme.colors.secondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                color: theme.colors.primary,
                fontSize: '1rem',
                flexShrink: 0,
              }}>
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: theme.colors.gray[800] }}>
                  {user.firstName} {user.lastName}
                </div>
                <div style={{ fontSize: '0.8rem', color: theme.colors.gray[500] }}>{user.major}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderTop: `1px solid ${theme.colors.gray[200]}`, paddingTop: theme.spacing[5], textAlign: 'center' }}>
          <button
            onClick={onCreateNew}
            style={{
              padding: '12px 28px',
              borderRadius: '12px',
              border: `2px solid ${theme.colors.primary}`,
              backgroundColor: 'white',
              color: theme.colors.primary,
              fontWeight: '600',
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = theme.colors.primary; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = theme.colors.primary; }}
          >
            Create New Account
          </button>
        </div>
      </div>
    </div>
  );
};
