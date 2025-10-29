import { createTheme } from '@mui/material/styles';

// Design tokens
export const tokens = {
  colors: {
    // Primary palette
    primary: {
      50: '#f0f4ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
    },
    // Neutral palette
    neutral: {
      0: '#ffffff',
      50: '#fafbfc',
      100: '#f4f6f8',
      200: '#e4e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#0a0e1a',
    },
    // Semantic colors
    success: {
      50: '#ecfdf5',
      100: '#d1fae5',
      200: '#a7f3d0',
      300: '#6ee7b7',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    // Gradient colors
    gradients: {
      primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      purple: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      pink: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      ocean: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      sunset: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    }
  },
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '3.75rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    letterSpacing: {
      tighter: '-0.05em',
      tight: '-0.025em',
      normal: '0em',
      wide: '0.025em',
      wider: '0.05em',
      widest: '0.1em',
    }
  },
  spacing: {
    0: '0px',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    32: '8rem',
    40: '10rem',
    48: '12rem',
    56: '14rem',
    64: '16rem',
  },
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(99, 102, 241, 0.3)',
    glowLg: '0 0 40px rgba(99, 102, 241, 0.4)',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  }
};

// Create MUI theme with our design tokens
export const muiTheme = createTheme({
  palette: {
    primary: {
      main: tokens.colors.primary[500],
      light: tokens.colors.primary[400],
      dark: tokens.colors.primary[600],
    },
    secondary: {
      main: tokens.colors.neutral[600],
      light: tokens.colors.neutral[400],
      dark: tokens.colors.neutral[800],
    },
    success: {
      main: tokens.colors.success[500],
      light: tokens.colors.success[400],
      dark: tokens.colors.success[600],
    },
    warning: {
      main: tokens.colors.warning[500],
      light: tokens.colors.warning[400],
      dark: tokens.colors.warning[600],
    },
    error: {
      main: tokens.colors.error[500],
      light: tokens.colors.error[400],
      dark: tokens.colors.error[600],
    },
    background: {
      default: tokens.colors.neutral[50],
      paper: tokens.colors.neutral[0],
    },
    text: {
      primary: tokens.colors.neutral[900],
      secondary: tokens.colors.neutral[600],
    },
  },
  typography: {
    fontFamily: tokens.typography.fontFamily.sans,
    h1: {
      fontSize: tokens.typography.fontSize['5xl'],
      fontWeight: tokens.typography.fontWeight.black,
      lineHeight: tokens.typography.lineHeight.tight,
      letterSpacing: tokens.typography.letterSpacing.tight,
    },
    h2: {
      fontSize: tokens.typography.fontSize['4xl'],
      fontWeight: tokens.typography.fontWeight.extrabold,
      lineHeight: tokens.typography.lineHeight.tight,
      letterSpacing: tokens.typography.letterSpacing.tight,
    },
    h3: {
      fontSize: tokens.typography.fontSize['3xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.lineHeight.snug,
    },
    h4: {
      fontSize: tokens.typography.fontSize['2xl'],
      fontWeight: tokens.typography.fontWeight.bold,
      lineHeight: tokens.typography.lineHeight.snug,
    },
    h5: {
      fontSize: tokens.typography.fontSize.xl,
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.lineHeight.snug,
    },
    h6: {
      fontSize: tokens.typography.fontSize.lg,
      fontWeight: tokens.typography.fontWeight.semibold,
      lineHeight: tokens.typography.lineHeight.normal,
    },
    body1: {
      fontSize: tokens.typography.fontSize.base,
      lineHeight: tokens.typography.lineHeight.relaxed,
    },
    body2: {
      fontSize: tokens.typography.fontSize.sm,
      lineHeight: tokens.typography.lineHeight.normal,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          scrollBehavior: 'smooth',
        },
        body: {
          fontFamily: tokens.typography.fontFamily.sans,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
  },
});

export default tokens;
