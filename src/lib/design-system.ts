// Design System for PedidoList
// This file defines all design tokens and utilities for consistent UI

export const designSystem = {
  colors: {
    // Primary Colors - Blue theme
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    // Success Colors - Green
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      800: '#065f46',
      900: '#064e3b',
      950: '#022c22',
    },
    // Warning Colors - Amber
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
      950: '#451a03',
    },
    // Error Colors - Red
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
      950: '#450a0a',
    },
    // Neutral Colors - Gray
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    // Semantic Colors
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#1f2937',
      secondary: '#374151',
      tertiary: '#6b7280',
      inverse: '#ffffff',
    },
    border: {
      light: '#e5e7eb',
      medium: '#d1d5db',
      dark: '#9ca3af',
    }
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    xxl: '3rem',      // 48px
    xxxl: '4rem',     // 64px
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  typography: {
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'monospace'],
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
      '5xl': '3rem',     // 48px
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    }
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    hide: '-1',
    auto: 'auto',
    base: '0',
    docked: '10',
    dropdown: '1000',
    sticky: '1100',
    banner: '1200',
    overlay: '1300',
    modal: '1400',
    popover: '1500',
    skipLink: '1600',
    toast: '1700',
    tooltip: '1800',
  },
  
  transitions: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
    }
  }
}

// Utility functions for design system
export const getColor = (colorPath: string) => {
  const path = colorPath.split('.')
  let value: any = designSystem.colors
  
  for (const key of path) {
    value = value[key]
    if (!value) break
  }
  
  return value || colorPath
}

export const getSpacing = (size: keyof typeof designSystem.spacing) => {
  return designSystem.spacing[size]
}

export const getBorderRadius = (size: keyof typeof designSystem.borderRadius) => {
  return designSystem.borderRadius[size]
}

export const getShadow = (size: keyof typeof designSystem.shadows) => {
  return designSystem.shadows[size]
}

// CSS Custom Properties for use in CSS
export const cssCustomProperties = `
  :root {
    /* Primary Colors */
    --color-primary-50: ${designSystem.colors.primary[50]};
    --color-primary-500: ${designSystem.colors.primary[500]};
    --color-primary-600: ${designSystem.colors.primary[600]};
    --color-primary-700: ${designSystem.colors.primary[700]};
    
    /* Success Colors */
    --color-success-50: ${designSystem.colors.success[50]};
    --color-success-500: ${designSystem.colors.success[500]};
    --color-success-600: ${designSystem.colors.success[600]};
    
    /* Warning Colors */
    --color-warning-50: ${designSystem.colors.warning[50]};
    --color-warning-500: ${designSystem.colors.warning[500]};
    --color-warning-600: ${designSystem.colors.warning[600]};
    
    /* Error Colors */
    --color-error-50: ${designSystem.colors.error[50]};
    --color-error-500: ${designSystem.colors.error[500]};
    --color-error-600: ${designSystem.colors.error[600]};
    
    /* Neutral Colors */
    --color-neutral-50: ${designSystem.colors.neutral[50]};
    --color-neutral-100: ${designSystem.colors.neutral[100]};
    --color-neutral-200: ${designSystem.colors.neutral[200]};
    --color-neutral-300: ${designSystem.colors.neutral[300]};
    --color-neutral-400: ${designSystem.colors.neutral[400]};
    --color-neutral-500: ${designSystem.colors.neutral[500]};
    --color-neutral-600: ${designSystem.colors.neutral[600]};
    --color-neutral-700: ${designSystem.colors.neutral[700]};
    --color-neutral-800: ${designSystem.colors.neutral[800]};
    --color-neutral-900: ${designSystem.colors.neutral[900]};
    
    /* Semantic Colors */
    --color-background-primary: ${designSystem.colors.background.primary};
    --color-background-secondary: ${designSystem.colors.background.secondary};
    --color-text-primary: ${designSystem.colors.text.primary};
    --color-text-secondary: ${designSystem.colors.text.secondary};
    --color-text-tertiary: ${designSystem.colors.text.tertiary};
    --color-border-light: ${designSystem.colors.border.light};
    --color-border-medium: ${designSystem.colors.border.medium};
    
    /* Spacing */
    --spacing-xs: ${designSystem.spacing.xs};
    --spacing-sm: ${designSystem.spacing.sm};
    --spacing-md: ${designSystem.spacing.md};
    --spacing-lg: ${designSystem.spacing.lg};
    --spacing-xl: ${designSystem.spacing.xl};
    --spacing-xxl: ${designSystem.spacing.xxl};
    
    /* Border Radius */
    --radius-sm: ${designSystem.borderRadius.sm};
    --radius-md: ${designSystem.borderRadius.md};
    --radius-lg: ${designSystem.borderRadius.lg};
    --radius-xl: ${designSystem.borderRadius.xl};
    --radius-2xl: ${designSystem.borderRadius['2xl']};
    
    /* Shadows */
    --shadow-sm: ${designSystem.shadows.sm};
    --shadow-md: ${designSystem.shadows.md};
    --shadow-lg: ${designSystem.shadows.lg};
    --shadow-xl: ${designSystem.shadows.xl};
    
    /* Transitions */
    --transition-fast: ${designSystem.transitions.duration.fast};
    --transition-normal: ${designSystem.transitions.duration.normal};
    --transition-slow: ${designSystem.transitions.duration.slow};
  }
`

export default designSystem 