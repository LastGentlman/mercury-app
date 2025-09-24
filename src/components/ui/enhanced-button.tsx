import React from 'react'
import { cn } from '../../lib/ui-utils.ts'

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
      bg-blue-500
      hover:bg-blue-600
      active:bg-blue-700
      text-white
      focus:ring-blue-500
      shadow-sm
      hover:shadow-md
    `,
    secondary: `
      bg-gray-100
      dark:bg-gray-800
      hover:bg-gray-200
      dark:hover:bg-gray-700
      active:bg-gray-300
      dark:active:bg-gray-600
      text-gray-700
      dark:text-gray-200
      focus:ring-gray-500
      border
      border-gray-300
      dark:border-gray-600
    `,
    success: `
      bg-green-500
      hover:bg-green-600
      active:bg-green-700
      text-white
      focus:ring-green-500
      shadow-sm
      hover:shadow-md
    `,
    danger: `
      bg-red-500
      hover:bg-red-600
      active:bg-red-700
      text-white
      focus:ring-red-500
      shadow-sm
      hover:shadow-md
    `,
    ghost: `
      bg-transparent
      hover:bg-gray-100
      dark:hover:bg-gray-800
      active:bg-gray-200
      dark:active:bg-gray-700
      text-gray-700
      dark:text-gray-200
      focus:ring-gray-500
    `,
    outline: `
      bg-transparent
      border-2
      border-blue-500
      hover:bg-blue-50
      dark:hover:bg-blue-900/20
      active:bg-blue-100
      dark:active:bg-blue-900/30
      text-blue-700
      dark:text-blue-300
      focus:ring-blue-500
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