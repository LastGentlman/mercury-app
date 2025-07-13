import React from 'react'
import { cn } from '../../lib/ui-utils'
import { designSystem } from '../../lib/design-system'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
  }
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error'
  className?: string
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  variant = 'default',
  className,
}) => {
  const variantClasses = {
    default: {
      bg: `bg-[${designSystem.colors.neutral[50]}]`,
      border: `border-[${designSystem.colors.neutral[200]}]`,
      icon: `text-[${designSystem.colors.neutral[400]}]`,
    },
    success: {
      bg: `bg-[${designSystem.colors.success[50]}]`,
      border: `border-[${designSystem.colors.success[200]}]`,
      icon: `text-[${designSystem.colors.success[500]}]`,
    },
    warning: {
      bg: `bg-[${designSystem.colors.warning[50]}]`,
      border: `border-[${designSystem.colors.warning[200]}]`,
      icon: `text-[${designSystem.colors.warning[500]}]`,
    },
    error: {
      bg: `bg-[${designSystem.colors.error[50]}]`,
      border: `border-[${designSystem.colors.error[200]}]`,
      icon: `text-[${designSystem.colors.error[500]}]`,
    },
  }

  const changeColors = {
    increase: `text-[${designSystem.colors.success[600]}]`,
    decrease: `text-[${designSystem.colors.error[600]}]`,
  }

  const config = variantClasses[variant]

  return (
    <div className={cn(
      'p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md',
      config.bg,
      config.border,
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
          {change && (
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                changeColors[change.type]
              )}>
                {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
              </span>
              <span className="text-sm text-gray-500">vs mes anterior</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn('text-2xl', config.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
} 