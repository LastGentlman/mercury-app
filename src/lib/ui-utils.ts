import { designSystem } from './design-system'

// Common UI utility functions using the design system

export const uiUtils = {
  // Button variants
  button: {
    primary: `
      bg-[${designSystem.colors.primary[500]}]
      hover:bg-[${designSystem.colors.primary[600]}]
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-[${designSystem.colors.primary[500]}]
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white
      hover:bg-[${designSystem.colors.neutral[50]}]
      text-[${designSystem.colors.neutral[700]}]
      border
      border-[${designSystem.colors.neutral[300]}]
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-[${designSystem.colors.primary[500]}]
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    danger: `
      bg-[${designSystem.colors.error[500]}]
      hover:bg-[${designSystem.colors.error[600]}]
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-[${designSystem.colors.error[500]}]
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    success: `
      bg-[${designSystem.colors.success[500]}]
      hover:bg-[${designSystem.colors.success[600]}]
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-[${designSystem.colors.success[500]}]
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
  },

  // Input styles
  input: {
    base: `
      w-full
      px-3 py-2
      border
      border-[${designSystem.colors.neutral[300]}]
      rounded-lg
      text-[${designSystem.colors.text.primary}]
      placeholder-[${designSystem.colors.text.tertiary}]
      transition-colors
      duration-200
      focus:outline-none
      focus:border-[${designSystem.colors.primary[500]}]
      focus:ring-2
      focus:ring-[${designSystem.colors.primary[500]}]
      focus:ring-opacity-20
      disabled:bg-[${designSystem.colors.neutral[100]}]
      disabled:cursor-not-allowed
    `,
    error: `
      border-[${designSystem.colors.error[500]}]
      focus:border-[${designSystem.colors.error[500]}]
      focus:ring-[${designSystem.colors.error[500]}]
    `,
    success: `
      border-[${designSystem.colors.success[500]}]
      focus:border-[${designSystem.colors.success[500]}]
      focus:ring-[${designSystem.colors.success[500]}]
    `,
  },

  // Card styles
  card: {
    base: `
      bg-white
      rounded-xl
      shadow-md
      border
      border-[${designSystem.colors.neutral[200]}]
      overflow-hidden
    `,
    elevated: `
      bg-white
      rounded-xl
      shadow-lg
      border
      border-[${designSystem.colors.neutral[200]}]
      overflow-hidden
    `,
    flat: `
      bg-white
      rounded-xl
      border
      border-[${designSystem.colors.neutral[200]}]
      overflow-hidden
    `,
  },

  // Badge styles
  badge: {
    primary: `
      bg-[${designSystem.colors.primary[100]}]
      text-[${designSystem.colors.primary[700]}]
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    success: `
      bg-[${designSystem.colors.success[100]}]
      text-[${designSystem.colors.success[700]}]
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    warning: `
      bg-[${designSystem.colors.warning[100]}]
      text-[${designSystem.colors.warning[700]}]
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    error: `
      bg-[${designSystem.colors.error[100]}]
      text-[${designSystem.colors.error[700]}]
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    neutral: `
      bg-[${designSystem.colors.neutral[100]}]
      text-[${designSystem.colors.neutral[700]}]
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
  },

  // Alert styles
  alert: {
    success: `
      bg-[${designSystem.colors.success[50]}]
      border
      border-[${designSystem.colors.success[200]}]
      text-[${designSystem.colors.success[800]}]
      p-4
      rounded-lg
    `,
    warning: `
      bg-[${designSystem.colors.warning[50]}]
      border
      border-[${designSystem.colors.warning[200]}]
      text-[${designSystem.colors.warning[800]}]
      p-4
      rounded-lg
    `,
    error: `
      bg-[${designSystem.colors.error[50]}]
      border
      border-[${designSystem.colors.error[200]}]
      text-[${designSystem.colors.error[800]}]
      p-4
      rounded-lg
    `,
    info: `
      bg-[${designSystem.colors.primary[50]}]
      border
      border-[${designSystem.colors.primary[200]}]
      text-[${designSystem.colors.primary[800]}]
      p-4
      rounded-lg
    `,
  },

  // Layout utilities
  layout: {
    container: `
      max-w-7xl
      mx-auto
      px-4
      sm:px-6
      lg:px-8
    `,
    section: `
      py-8
      sm:py-12
      lg:py-16
    `,
    grid: {
      cols1: 'grid grid-cols-1 gap-4',
      cols2: 'grid grid-cols-1 md:grid-cols-2 gap-4',
      cols3: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
      cols4: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4',
    },
  },

  // Typography utilities
  text: {
    h1: `
      text-4xl
      font-bold
      text-[${designSystem.colors.text.primary}]
      leading-tight
    `,
    h2: `
      text-3xl
      font-semibold
      text-[${designSystem.colors.text.primary}]
      leading-tight
    `,
    h3: `
      text-2xl
      font-semibold
      text-[${designSystem.colors.text.primary}]
      leading-tight
    `,
    h4: `
      text-xl
      font-medium
      text-[${designSystem.colors.text.primary}]
      leading-tight
    `,
    body: `
      text-base
      text-[${designSystem.colors.text.secondary}]
      leading-relaxed
    `,
    small: `
      text-sm
      text-[${designSystem.colors.text.tertiary}]
      leading-normal
    `,
  },

  // Spacing utilities
  spacing: {
    p: {
      xs: `p-${designSystem.spacing.xs}`,
      sm: `p-${designSystem.spacing.sm}`,
      md: `p-${designSystem.spacing.md}`,
      lg: `p-${designSystem.spacing.lg}`,
      xl: `p-${designSystem.spacing.xl}`,
    },
    m: {
      xs: `m-${designSystem.spacing.xs}`,
      sm: `m-${designSystem.spacing.sm}`,
      md: `m-${designSystem.spacing.md}`,
      lg: `m-${designSystem.spacing.lg}`,
      xl: `m-${designSystem.spacing.xl}`,
    },
  },
}

// Helper function to combine multiple class strings
export const cn = (...classes: Array<string | undefined | null | false>) => {
  return classes.filter(Boolean).join(' ')
}

// Helper function to get responsive classes
export const responsive = {
  sm: (classes: string) => `sm:${classes}`,
  md: (classes: string) => `md:${classes}`,
  lg: (classes: string) => `lg:${classes}`,
  xl: (classes: string) => `xl:${classes}`,
}

// Helper function to get state classes
export const state = {
  hover: (classes: string) => `hover:${classes}`,
  focus: (classes: string) => `focus:${classes}`,
  active: (classes: string) => `active:${classes}`,
  disabled: (classes: string) => `disabled:${classes}`,
}

export default uiUtils 