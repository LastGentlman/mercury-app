import { useCacheUpdate } from '../hooks/useCacheUpdate'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { RefreshCw, X } from 'lucide-react'

export function CacheUpdateNotification() {
  const { hasUpdate, isUpdating, forceUpdate } = useCacheUpdate()

  if (!hasUpdate) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Nueva versión disponible</p>
              <p className="text-sm text-blue-600">
                Se ha detectado una versión más reciente de la aplicación.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={forceUpdate}
              disabled={isUpdating}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Actualizar Ahora
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="border-blue-300 text-blue-600 hover:bg-blue-100"
            >
              Recargar
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}
