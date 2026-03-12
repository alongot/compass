import { theme } from '../styles/theme.js';
import { describe, it, expect } from 'vitest';

describe('theme token set (UI-01)', () => {
  it('has colors.primary and colors.secondary', () => {
    expect(theme.colors.primary).toBeDefined();
    expect(theme.colors.secondary).toBeDefined();
  });
  it('has typography with display, body, mono, scale, weight', () => {
    expect(theme.typography).toBeDefined();
    expect(theme.typography.display).toBeDefined();
    expect(theme.typography.body).toBeDefined();
    expect(theme.typography.scale).toBeDefined();
    expect(theme.typography.weight).toBeDefined();
  });
  it('has spacing tokens', () => {
    expect(theme.spacing).toBeDefined();
    expect(theme.spacing[4]).toBeDefined();
  });
  it('has radii tokens', () => {
    expect(theme.radii).toBeDefined();
    expect(theme.radii.md).toBeDefined();
  });
  it('has shadows tokens', () => {
    expect(theme.shadows).toBeDefined();
    expect(theme.shadows.md).toBeDefined();
  });
  it('has transitions tokens', () => {
    expect(theme.transitions).toBeDefined();
    expect(theme.transitions.base).toBeDefined();
  });
});
