import { useEffect, useState } from 'react'
import { 
  CheckCircle,
  Download, 
  Info, 
  Monitor,
  RefreshCw,
  Smartphone, 
  XCircle
} from 'lucide-react'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { PWAInstallButton } from '../components/PWAInstallButton'
import { PWAStatus } from '../components/PWAStatus'
import { 
  getPWALaunchMethod,
  isPWAInstalled, 
  showInstallPrompt,
  wasEverInstalledAsPWA
} from '../pwa'

export function PWADemo() {
  const [pwaState, setPwaState] = useState({
    isInstalled: false,
    launchMethod: 'unknown' as 'browser' | 'installed' | 'unknown',
    wasEverInstalled: false,
    canInstall: false
  })

  const updatePWAState = () => {
    setPwaState({
      isInstalled: isPWAInstalled(),
      launchMethod: getPWALaunchMethod(),
      wasEverInstalled: wasEverInstalledAsPWA(),
      canInstall: !!(window as any).deferredPrompt
    })
  }

  useEffect(() => {
    updatePWAState()

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      ;(window as any).deferredPrompt = e
      updatePWAState()
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleManualInstall = async () => {
    try {
      const installed = await showInstallPrompt()
      if (installed) {
        updatePWAState()
      }
    } catch (error) {
      console.error('Manual install failed:', error)
    }
  }

  const getStatusIcon = () => {
    switch (pwaState.launchMethod) {
      case 'installed':
        return <Smartphone className="w-6 h-6 text-green-600" />
      case 'browser':
        return <Monitor className="w-6 h-6 text-blue-600" />
      default:
        return <Info className="w-6 h-6 text-gray-600" />
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Enhanced PWA Demo</h1>
        <p className="text-gray-600">
          Test and explore the enhanced Progressive Web App features
        </p>
      </div>

      {/* Current Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Current PWA Status
          </CardTitle>
          <CardDescription>
            Real-time detection of how the app is currently running
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Launch Method:</span>
              <Badge variant={pwaState.launchMethod === 'installed' ? 'default' : 'secondary'}>
                {pwaState.launchMethod}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Is PWA Installed:</span>
              {pwaState.isInstalled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Previously Installed:</span>
              {pwaState.wasEverInstalled ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">Can Install:</span>
              {pwaState.canInstall ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Status Component Demo */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>PWA Status Component</CardTitle>
          <CardDescription>
            The PWAStatus component in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PWAStatus />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>
            Test PWA functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={updatePWAState}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Status
            </Button>

            {pwaState.canInstall && (
              <Button 
                onClick={handleManualInstall}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Install App
              </Button>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Tip:</strong> Open this page in different contexts to test PWA detection:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Regular browser tab</li>
              <li>Installed PWA</li>
              <li>Mobile browser</li>
              <li>Desktop browser</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
          <CardDescription>
            How PWA detection works
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Detection Methods:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Display mode: <code>window.matchMedia('(display-mode: standalone)')</code></li>
                <li>iOS Safari: <code>window.navigator.standalone</code></li>
                <li>URL parameters: <code>utm_source=pwa</code> or <code>source=pwa</code></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Storage Keys:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><code>pwa-installed</code>: Boolean flag</li>
                <li><code>pwa-install-date</code>: Installation timestamp</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Service Worker Features:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Background sync registration</li>
                <li>Periodic background sync</li>
                <li>Update detection and prompts</li>
                <li>Offline data synchronization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Floating Install Button */}
      <PWAInstallButton />
    </div>
  )
} 