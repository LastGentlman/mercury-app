import React from 'react'
import { cn } from '../../lib/ui-utils.ts'
import { designSystem } from '../../lib/design-system.ts'

// Button Component with Design System
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
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
  `

  const variantClasses = {
    primary: `
      bg-[${designSystem.colors.primary[500]}]
      hover:bg-[${designSystem.colors.primary[600]}]
      text-white
      focus:ring-[${designSystem.colors.primary[500]}]
    `,
    secondary: `
      bg-[${designSystem.colors.neutral[100]}]
      hover:bg-[${designSystem.colors.neutral[200]}]
      text-[${designSystem.colors.neutral[700]}]
      focus:ring-[${designSystem.colors.neutral[500]}]
    `,
    danger: `
      bg-[${designSystem.colors.error[500]}]
      hover:bg-[${designSystem.colors.error[600]}]
      text-white
      focus:ring-[${designSystem.colors.error[500]}]
    `,
    success: `
      bg-[${designSystem.colors.success[500]}]
      hover:bg-[${designSystem.colors.success[600]}]
      text-white
      focus:ring-[${designSystem.colors.success[500]}]
    `,
    outline: `
      bg-transparent
      border
      border-[${designSystem.colors.neutral[300]}]
      hover:bg-[${designSystem.colors.neutral[50]}]
      text-[${designSystem.colors.neutral[700]}]
      focus:ring-[${designSystem.colors.neutral[500]}]
    `,
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// Input Component with Design System
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  success,
  helperText,
  className,
  ...props
}) => {
  const baseClasses = `
    w-full
    px-3 py-2
    border
    rounded-lg
    transition-colors
    duration-200
    focus:outline-none
    focus:ring-2
    focus:ring-opacity-20
    disabled:bg-[${designSystem.colors.neutral[100]}]
    disabled:cursor-not-allowed
  `

  const stateClasses = error
    ? `
      border-[${designSystem.colors.error[500]}]
      focus:border-[${designSystem.colors.error[500]}]
      focus:ring-[${designSystem.colors.error[500]}]
    `
    : success
    ? `
      border-[${designSystem.colors.success[500]}]
      focus:border-[${designSystem.colors.success[500]}]
      focus:ring-[${designSystem.colors.success[500]}]
    `
    : `
      border-[${designSystem.colors.neutral[300]}]
      focus:border-[${designSystem.colors.primary[500]}]
      focus:ring-[${designSystem.colors.primary[500]}]
    `

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-[#374151]">
          {label}
        </label>
      )}
      <input
        className={cn(
          baseClasses,
          stateClasses,
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <p
          className={cn(
            'text-sm',
            error
              ? `text-[${designSystem.colors.error[600]}]`
              : `text-[${designSystem.colors.neutral[500]}]`
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  )
}

// Card Component with Design System
interface CardProps {
  variant?: 'base' | 'elevated' | 'flat'
  children: React.ReactNode
  className?: string
}

export const Card: React.FC<CardProps> = ({
  variant = 'base',
  children,
  className,
}) => {
  const baseClasses = `
    bg-white
    rounded-xl
    overflow-hidden
  `

  const variantClasses = {
    base: `
      shadow-md
      border
      border-[${designSystem.colors.neutral[200]}]
    `,
    elevated: `
      shadow-lg
      border
      border-[${designSystem.colors.neutral[200]}]
    `,
    flat: `
      border
      border-[${designSystem.colors.neutral[200]}]
    `,
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </div>
  )
}

// Badge Component with Design System
interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  children: React.ReactNode
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className,
}) => {
  const baseClasses = `
    inline-flex
    items-center
    px-2
    py-1
    rounded-md
    text-xs
    font-medium
  `

  const variantClasses = {
    primary: `
      bg-[${designSystem.colors.primary[100]}]
      text-[${designSystem.colors.primary[700]}]
    `,
    success: `
      bg-[${designSystem.colors.success[100]}]
      text-[${designSystem.colors.success[700]}]
    `,
    warning: `
      bg-[${designSystem.colors.warning[100]}]
      text-[${designSystem.colors.warning[700]}]
    `,
    error: `
      bg-[${designSystem.colors.error[100]}]
      text-[${designSystem.colors.error[700]}]
    `,
    neutral: `
      bg-[${designSystem.colors.neutral[100]}]
      text-[${designSystem.colors.neutral[700]}]
    `,
  }

  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  )
}

// Alert Component with Design System
interface AlertProps {
  variant?: 'success' | 'warning' | 'error' | 'info'
  title?: string
  children: React.ReactNode
  className?: string
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className,
}) => {
  const baseClasses = `
    p-4
    rounded-lg
    border
  `

  const variantClasses = {
    success: `
      bg-[${designSystem.colors.success[50]}]
      border-[${designSystem.colors.success[200]}]
      text-[${designSystem.colors.success[800]}]
    `,
    warning: `
      bg-[${designSystem.colors.warning[50]}]
      border-[${designSystem.colors.warning[200]}]
      text-[${designSystem.colors.warning[800]}]
    `,
    error: `
      bg-[${designSystem.colors.error[50]}]
      border-[${designSystem.colors.error[200]}]
      text-[${designSystem.colors.error[800]}]
    `,
    info: `
      bg-[${designSystem.colors.primary[50]}]
      border-[${designSystem.colors.primary[200]}]
      text-[${designSystem.colors.primary[800]}]
    `,
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      {title && (
        <h3 className="font-medium mb-1">{title}</h3>
      )}
      <div className="text-sm">{children}</div>
    </div>
  )
}

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  )
}

// Divider Component
interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  className,
}) => {
  const baseClasses = `
    bg-[${designSystem.colors.neutral[200]}]
  `

  const orientationClasses = {
    horizontal: 'h-px w-full',
    vertical: 'w-px h-full',
  }

  return (
    <div
      className={cn(baseClasses, orientationClasses[orientation], className)}
    />
  )
}

// Container Component
interface ContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export const Container: React.FC<ContainerProps> = ({
  children,
  className,
  maxWidth = 'xl',
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }

  return (
    <div
      className={cn(
        'mx-auto px-4 sm:px-6 lg:px-8',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
} 