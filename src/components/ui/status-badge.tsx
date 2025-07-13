import React from 'react'
import { cn } from '../../lib/ui-utils'
import { designSystem } from '../../lib/design-system'

interface StatusBadgeProps {
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  children?: React.ReactNode
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  children,
  className,
}) => {
  const statusConfig = {
    pending: {
      label: 'Pendiente',
      color: `bg-[${designSystem.colors.warning[100]}] text-[${designSystem.colors.warning[700]}] border-[${designSystem.colors.warning[200]}]`,
      icon: '⏳',
      bgColor: designSystem.colors.warning[50],
      textColor: designSystem.colors.warning[700],
      borderColor: designSystem.colors.warning[200],
    },
    preparing: {
      label: 'En Preparación',
      color: `bg-[${designSystem.colors.primary[100]}] text-[${designSystem.colors.primary[700]}] border-[${designSystem.colors.primary[200]}]`,
      icon: '👨‍🍳',
      bgColor: designSystem.colors.primary[50],
      textColor: designSystem.colors.primary[700],
      borderColor: designSystem.colors.primary[200],
    },
    ready: {
      label: 'Listo',
      color: `bg-[${designSystem.colors.success[100]}] text-[${designSystem.colors.success[700]}] border-[${designSystem.colors.success[200]}]`,
      icon: '✅',
      bgColor: designSystem.colors.success[50],
      textColor: designSystem.colors.success[700],
      borderColor: designSystem.colors.success[200],
    },
    delivered: {
      label: 'Entregado',
      color: `bg-[${designSystem.colors.neutral[100]}] text-[${designSystem.colors.neutral[700]}] border-[${designSystem.colors.neutral[200]}]`,
      icon: '📦',
      bgColor: designSystem.colors.neutral[50],
      textColor: designSystem.colors.neutral[700],
      borderColor: designSystem.colors.neutral[200],
    },
    cancelled: {
      label: 'Cancelado',
      color: `bg-[${designSystem.colors.error[100]}] text-[${designSystem.colors.error[700]}] border-[${designSystem.colors.error[200]}]`,
      icon: '❌',
      bgColor: designSystem.colors.error[50],
      textColor: designSystem.colors.error[700],
      borderColor: designSystem.colors.error[200],
    },
  }

  const config = statusConfig[status]
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium transition-colors duration-200',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.textColor,
        borderColor: config.borderColor,
      }}
    >
      {showIcon && <span className="text-base">{config.icon}</span>}
      {children || config.label}
    </span>
  )
} 