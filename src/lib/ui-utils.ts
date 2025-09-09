// Common UI utility functions using Tailwind CSS classes

export const uiUtils = {
  // Button variants
  button: {
    primary: `
      bg-blue-500
      hover:bg-blue-600
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    secondary: `
      bg-white
      hover:bg-gray-50
      text-gray-700
      border
      border-gray-300
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    danger: `
      bg-red-500
      hover:bg-red-600
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-red-500
      focus:ring-opacity-50
      disabled:opacity-50
      disabled:cursor-not-allowed
    `,
    success: `
      bg-green-500
      hover:bg-green-600
      text-white
      font-medium
      px-4 py-2
      rounded-lg
      transition-colors
      duration-200
      focus:outline-none
      focus:ring-2
      focus:ring-green-500
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
      border-gray-300
      rounded-lg
      text-gray-900
      placeholder-gray-500
      transition-colors
      duration-200
      focus:outline-none
      focus:border-blue-500
      focus:ring-2
      focus:ring-blue-500
      focus:ring-opacity-20
      disabled:bg-gray-100
      disabled:cursor-not-allowed
    `,
    error: `
      border-red-500
      focus:border-red-500
      focus:ring-red-500
    `,
    success: `
      border-green-500
      focus:border-green-500
      focus:ring-green-500
    `,
  },

  // Card styles
  card: {
    base: `
      bg-white
      rounded-xl
      shadow-md
      border
      border-gray-200
      overflow-hidden
    `,
    elevated: `
      bg-white
      rounded-xl
      shadow-lg
      border
      border-gray-200
      overflow-hidden
    `,
    flat: `
      bg-white
      rounded-xl
      border
      border-gray-200
      overflow-hidden
    `,
  },

  // Badge styles
  badge: {
    primary: `
      bg-blue-100
      text-blue-700
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    success: `
      bg-green-100
      text-green-700
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    warning: `
      bg-yellow-100
      text-yellow-700
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    error: `
      bg-red-100
      text-red-700
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
    neutral: `
      bg-gray-100
      text-gray-700
      px-2 py-1
      rounded-md
      text-xs
      font-medium
    `,
  },

  // Alert styles
  alert: {
    success: `
      bg-green-50
      border
      border-green-200
      text-green-800
      p-4
      rounded-lg
    `,
    warning: `
      bg-yellow-50
      border
      border-yellow-200
      text-yellow-800
      p-4
      rounded-lg
    `,
    error: `
      bg-red-50
      border
      border-red-200
      text-red-800
      p-4
      rounded-lg
    `,
    info: `
      bg-blue-50
      border
      border-blue-200
      text-blue-800
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
      text-gray-900
      leading-tight
    `,
    h2: `
      text-3xl
      font-semibold
      text-gray-900
      leading-tight
    `,
    h3: `
      text-2xl
      font-semibold
      text-gray-900
      leading-tight
    `,
    h4: `
      text-xl
      font-medium
      text-gray-900
      leading-tight
    `,
    body: `
      text-base
      text-gray-700
      leading-relaxed
    `,
    small: `
      text-sm
      text-gray-500
      leading-normal
    `,
  },

  // Spacing utilities
  spacing: {
    p: {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    m: {
      xs: 'm-1',
      sm: 'm-2',
      md: 'm-4',
      lg: 'm-6',
      xl: 'm-8',
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