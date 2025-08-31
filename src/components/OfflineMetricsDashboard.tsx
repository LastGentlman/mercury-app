
import { useOfflineMetricsSummary } from '../hooks/useOfflineMetrics.ts'

/**
 * 🎯 OfflineMetricsDashboard - Dashboard de Métricas Offline
 * 
 * Muestra métricas en tiempo real del sistema de autenticación offline:
 * - Estado actual de conexión
 * - Tiempo offline acumulado
 * - Tasa de éxito de sincronización
 * - Métricas de heartbeat
 * - Sesiones offline
 */
export function OfflineMetricsDashboard() {
  const {
    isCurrentlyOffline,
    currentOfflineDuration,
    totalOfflineTime,
    syncSuccessRate,
    heartbeatSuccessRate,
    offlineSessions
  } = useOfflineMetricsSummary()

  // Formatear duración en formato legible
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`
    if (hours > 0) return `${hours}h ${minutes % 60}m`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }

  // Obtener color según el estado
  const getStatusColor = () => {
    if (isCurrentlyOffline) return 'text-red-600'
    return 'text-green-600'
  }

  // Obtener color según la tasa de éxito
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        📊 Métricas de Autenticación Offline
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Estado de Conexión */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Estado de Conexión
          </h3>
          <div className={`text-lg font-semibold ${getStatusColor()}`}>
            {isCurrentlyOffline ? '🔴 Offline' : '🟢 Online'}
          </div>
          {isCurrentlyOffline && (
            <div className="text-sm text-gray-500 mt-1">
              Tiempo offline: {formatDuration(currentOfflineDuration)}
            </div>
          )}
        </div>

        {/* Tiempo Offline Total */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Tiempo Offline Total
          </h3>
          <div className="text-lg font-semibold text-gray-800">
            {formatDuration(totalOfflineTime)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {offlineSessions} sesiones
          </div>
        </div>

        {/* Tasa de Éxito de Sincronización */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Sincronización
          </h3>
          <div className={`text-lg font-semibold ${getSuccessRateColor(syncSuccessRate)}`}>
            {syncSuccessRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tasa de éxito
          </div>
        </div>

        {/* Tasa de Éxito de Heartbeat */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-2">
            Heartbeat
          </h3>
          <div className={`text-lg font-semibold ${getSuccessRateColor(heartbeatSuccessRate)}`}>
            {heartbeatSuccessRate.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Tasa de éxito
          </div>
        </div>
      </div>

      {/* Información Adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          ℹ️ Información del Sistema
        </h3>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Período de gracia: 5 minutos</div>
          <div>• Heartbeat: Cada 30 segundos</div>
          <div>• Verificación híbrida: Local + Servidor</div>
          <div>• Sincronización automática al volver online</div>
        </div>
      </div>

      {/* Estado Actual */}
      <div className="mt-4 p-3 bg-gray-100 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>Estado actual:</strong> {isCurrentlyOffline 
            ? 'Trabajando en modo offline con sincronización diferida'
            : 'Conectado y sincronizando en tiempo real'
          }
        </div>
      </div>
    </div>
  )
}

/**
 * 🎯 Componente de Métricas Mínimas (para desarrollo)
 */
export function OfflineMetricsMini() {
  const { isCurrentlyOffline, syncSuccessRate } = useOfflineMetricsSummary()

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${isCurrentlyOffline ? 'bg-red-500' : 'bg-green-500'}`} />
        <span className="text-gray-700">
          {isCurrentlyOffline ? 'Offline' : 'Online'}
        </span>
        <span className="text-gray-500">
          | Sync: {syncSuccessRate.toFixed(0)}%
        </span>
      </div>
    </div>
  )
} 