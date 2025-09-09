import React from 'react'
import { cn } from '../../lib/ui-utils.ts'

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
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: '⏳',
      bgColor: '#fef3c7',
      textColor: '#b45309',
      borderColor: '#fde68a',
    },
    preparing: {
      label: 'En Preparación',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: '👨‍🍳',
      bgColor: '#dbeafe',
      textColor: '#1d4ed8',
      borderColor: '#93c5fd',
    },
    ready: {
      label: 'Listo',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: '✅',
      bgColor: '#dcfce7',
      textColor: '#047857',
      borderColor: '#bbf7d0',
    },
    delivered: {
      label: 'Entregado',
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: '📦',
      bgColor: '#f1f5f9',
      textColor: '#334155',
      borderColor: '#e2e8f0',
    },
    cancelled: {
      label: 'Cancelado',
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: '❌',
      bgColor: '#fee2e2',
      textColor: '#b91c1c',
      borderColor: '#fecaca',
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