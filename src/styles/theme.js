export const theme = {
  colors: {
    primary: '#003660',         // UCSB Navy — brand anchor
    secondary: '#FEBC11',       // UCSB Gold — brand anchor
    primaryLight: '#004d8a',    // Lighter navy for hover states
    primarySurface: '#e8f0f8',  // Very light navy tint for card backgrounds
    accent: '#1a6b4a',          // Deep green for positive states
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    surface: '#fafaf9',         // Off-white page background (not pure white)
    border: '#e2e4e9',
    successSurface: '#d1fae5',  // Light green surface for completed states
    successSurfaceLight: '#f0fdf4', // Very light green surface for completed rows
    successText: '#065f46',     // Dark green text for completed states
    successBorder: '#6ee7b7',   // Green border for completed states
    warningSurface: '#fef3c7',  // Light amber surface for warning states
    warningText: '#92400e',     // Dark amber text for warning states
    infoSurface: '#dbeafe',     // Light blue surface for in-progress states
    infoText: '#1e40af',        // Dark blue text for in-progress states
    infoBorder: '#93c5fd',      // Blue border for in-progress states
    dangerSurface: '#fef2f2',   // Light red surface for danger/destructive hover states
    successActive: '#16a34a',   // Darker green for progress/status badges
    successTextDark: '#14532d', // Very dark green text
    successBorderLight: '#bbf7d0', // Light green border
    successEmphasis: '#059669', // Dark emerald green for stat highlights
    warningActive: '#ca8a04',   // Darker amber for warning badges
    warningTextDark: '#713f12', // Very dark amber text
    warningSurfaceLight: '#fefce8', // Very light yellow surface
    warningBorder: '#fcd34d',   // Amber border
    info: '#3b82f6',            // Blue for in-progress indicators
    infoSurfaceLight: '#eff6ff',// Very light blue surface
    infoBorderLight: '#bfdbfe', // Light blue border
    dangerEmphasis: '#dc2626',  // Dark red for stat highlights
    slateGray: '#94a3b8',       // Slate gray for SVG paths and subtle elements
    pageBg: '#f8fafc',          // Light gray page background
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  typography: {
    display: "'Playfair Display', Georgia, serif",
    body: "'DM Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '2rem',
      '4xl': '2.5rem',
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      snug: '1.375',
      normal: '1.5',
      relaxed: '1.625',
    },
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
  },
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    full: '9999px',
  },
  shadows: {
    xs: '0 1px 2px rgba(0,0,0,0.05)',
    sm: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md: '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.05)',
    lg: '0 8px 32px rgba(0,0,0,0.12), 0 4px 8px rgba(0,0,0,0.06)',
    primary: '0 4px 16px rgba(0,54,96,0.25)',
    gold: '0 4px 16px rgba(254,188,17,0.35)',
  },
  transitions: {
    fast: '0.12s ease',
    base: '0.2s ease',
    slow: '0.35s ease',
  },
  zIndex: {
    modal: 100,
    overlay: 99,
    sidebar: 50,
    dropdown: 40,
  },
};
