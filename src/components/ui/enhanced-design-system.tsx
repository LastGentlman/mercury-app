import React from 'react'
import { cn } from '../../lib/ui-utils.ts'
import { designSystem } from '../../lib/design-system.ts'

// ============================================================================
// ENHANCED BUTTON COMPONENT
// ============================================================================

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  children: React.ReactNode
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  className,
  children,
  disabled,
  ...props
}) => {
  const baseClasses = `
    font-medium
    rounded-lg
    transition-all
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-opacity-50
    disabled:opacity-50
    disabled:cursor-not-allowed
    inline-flex
    items-center
    justify-center
    gap-2
    relative
    overflow-hidden
  `

  const variantClasses = {
    primary: `
      bg-[${designSystem.colors.primary[500]}]
      hover:bg-[${designSystem.colors.primary[600]}]
      active:bg-[${designSystem.colors.primary[700]}]
      text-white
      focus:ring-[${designSystem.colors.primary[500]}]
      shadow-sm
      hover:shadow-md
    `,
    secondary: `
      bg-[${designSystem.colors.neutral[100]}]
      hover:bg-[${designSystem.colors.neutral[200]}]
      active:bg-[${designSystem.colors.neutral[300]}]
      text-[${designSystem.colors.neutral[700]}]
      focus:ring-[${designSystem.colors.neutral[500]}]
      border
      border-[${designSystem.colors.neutral[300]}]
    `,
    success: `
      bg-[${designSystem.colors.success[500]}]
      hover:bg-[${designSystem.colors.success[600]}]
      active:bg-[${designSystem.colors.success[700]}]
      text-white
      focus:ring-[${designSystem.colors.success[500]}]
      shadow-sm
      hover:shadow-md
    `,
    danger: `
      bg-[${designSystem.colors.error[500]}]
      hover:bg-[${designSystem.colors.error[600]}]
      active:bg-[${designSystem.colors.error[700]}]
      text-white
      focus:ring-[${designSystem.colors.error[500]}]
      shadow-sm
      hover:shadow-md
    `,
    ghost: `
      bg-transparent
      hover:bg-[${designSystem.colors.neutral[100]}]
      active:bg-[${designSystem.colors.neutral[200]}]
      text-[${designSystem.colors.neutral[700]}]
      focus:ring-[${designSystem.colors.neutral[500]}]
    `,
    outline: `
      bg-transparent
      border-2
      border-[${designSystem.colors.primary[500]}]
      hover:bg-[${designSystem.colors.primary[50]}]
      active:bg-[${designSystem.colors.primary[100]}]
      text-[${designSystem.colors.primary[700]}]
      focus:ring-[${designSystem.colors.primary[500]}]
    `,
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm h-8',
    md: 'px-4 py-2 text-base h-10',
    lg: 'px-6 py-3 text-lg h-12',
    xl: 'px-8 py-4 text-xl h-14',
  }

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
          <span>Cargando...</span>
        </>
      )
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          {children}
        </>
      )
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          {children}
          {icon}
        </>
      )
    }

    return children
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  )
}

// ============================================================================
// ENHANCED STATUS BADGE COMPONENT
// ============================================================================

// StatusBadge is already defined in status-badge.tsx

// ============================================================================
// ENHANCED ORDER CARD COMPONENT
// ============================================================================

// OrderCard is already defined in OrderCard.tsx

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

// StatsCard is already defined in stats-card.tsx

// ============================================================================
// ENHANCED INPUT COMPONENT
// ============================================================================

// EnhancedInput is already defined in input.tsx

// ============================================================================
// LOADING SKELETON COMPONENT
// ============================================================================

// Skeleton is already defined in skeleton.tsx

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

// EmptyState is already defined in empty-state.tsx

// ============================================================================
// EXPORT ALL COMPONENTS
// ============================================================================

export {
  EnhancedButton as Button,
} 