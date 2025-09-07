import { useMobileScrollVisualTest } from '../hooks/useMobileScrollVisualTest'

export const MobileScrollVisualDebugger = () => {
  const debugInfo = useMobileScrollVisualTest()

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed top-4 left-4 bg-black/90 text-white p-3 rounded-lg text-xs max-w-xs max-h-96 overflow-auto z-50">
      <div className="font-bold mb-2 text-green-400">🎯 Mobile Scroll Debug</div>
      <div className="space-y-1">
        {debugInfo.map((info, index) => (
          <div key={index} className="text-xs font-mono">
            {info}
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-gray-600">
        <div className="text-xs text-gray-400">
          Tap inputs to test scroll
        </div>
      </div>
    </div>
  )
}
