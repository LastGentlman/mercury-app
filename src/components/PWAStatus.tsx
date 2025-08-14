import { useEffect, useState } from 'react'
import { HelpCircle, Monitor, Smartphone } from 'lucide-react'
import { isPWAInstalled as _isPWAInstalled, getPWALaunchMethod, wasEverInstalledAsPWA } from '../pwa-fixed.ts'

export function PWAStatus() {
  const [launchMethod, setLaunchMethod] = useState<'browser' | 'installed' | 'unknown'>('unknown')
  const [wasEverInstalled, setWasEverInstalled] = useState(false)

  useEffect(() => {
    setLaunchMethod(getPWALaunchMethod())
    setWasEverInstalled(wasEverInstalledAsPWA())
  }, [])

  const getStatusInfo = () => {
    switch (launchMethod) {
      case 'installed':
        return {
          icon: <Smartphone className="w-4 h-4 text-green-600" />,
          text: 'Running as installed app',
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        }
      case 'browser':
        return {
          icon: <Monitor className="w-4 h-4 text-blue-600" />,
          text: 'Running in browser',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        }
      default:
        return {
          icon: <HelpCircle className="w-4 h-4 text-gray-600" />,
          text: 'Launch method unknown',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div 
      data-testid="badge"
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.color}`}
    >
      {statusInfo.icon}
      <span>{statusInfo.text}</span>
      {wasEverInstalled && launchMethod === 'browser' && (
        <span className="text-xs opacity-75">(previously installed)</span>
      )}
    </div>
  )
} 