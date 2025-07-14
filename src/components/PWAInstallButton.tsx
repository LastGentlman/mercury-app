import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { getPWALaunchMethod, isPWAInstalled, markAsInstalledPWA, showInstallPrompt, wasEverInstalledAsPWA } from '../pwa'
import { useWindowEventListener } from '../hooks/useEventListener'

export function PWAInstallButton() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [_launchMethod, setLaunchMethod] = useState<'browser' | 'installed' | 'unknown'>('unknown')

  useEffect(() => {
    // Check if already installed
    setIsInstalled(isPWAInstalled())
    setLaunchMethod(getPWALaunchMethod())
  }, [])

  // ✅ CORREGIDO: Usar hook seguro para event listeners
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    setCanInstall(true)
  }

  useWindowEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

  const handleInstall = async () => {
    try {
      const installed = await showInstallPrompt()
      if (installed) {
        setCanInstall(false)
        setIsInstalled(true)
        setLaunchMethod('installed')
        markAsInstalledPWA() // <-- Call this when installation is successful
      }
    } catch (error) {
      console.error('Install failed:', error)
    }
  }

  // Don't show if already installed or can't install
  if (isInstalled || !canInstall) {
    return null
  }

  // Optional: Show different text based on previous installation
  const wasEverInstalled = wasEverInstalledAsPWA()
  const buttonText = wasEverInstalled ? 'Reinstall App' : 'Install App'

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-50 transition-colors"
      title={`${buttonText} - Mercury App`}
      data-testid="button"
    >
      <Download size={20} />
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  )
} 