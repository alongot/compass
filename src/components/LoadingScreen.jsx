import React from 'react';
import { theme } from '../styles/theme.js';

export const LoadingScreen = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.pageBg,
    fontFamily: theme.typography.body,
  }}>
    <div style={{ textAlign: 'center' }}>
      <h1 style={{
        color: theme.colors.primary,
        fontSize: '2rem',
        fontWeight: '800',
        fontFamily: theme.typography.display,
        margin: '0 0 8px 0',
      }}>
        Compass
      </h1>
      <p style={{ color: theme.colors.gray[400], fontSize: '0.85rem' }}>Loading...</p>
    </div>
  </div>
);
