import { useState, useEffect } from 'react'

export const MobileScrollDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    windowWidth: 0,
    windowHeight: 0,
    isMobile: false,
    scrollY: 0,
    lastFocusEvent: null as string | null,
    scrollEvents: [] as string[]
  })

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo(prev => ({
        ...prev,
        windowWidth: globalThis.window.innerWidth,
        windowHeight: globalThis.window.innerHeight,
        isMobile: globalThis.window.innerWidth <= 768,
        scrollY: globalThis.window.scrollY
      }))
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      setDebugInfo(prev => ({
        ...prev,
        lastFocusEvent: `${target.tagName} (${target.id || 'no-id'}) - ${new Date().toLocaleTimeString()}`
      }))
    }

    const handleScroll = () => {
      setDebugInfo(prev => ({
        ...prev,
        scrollY: globalThis.window.scrollY,
        scrollEvents: [...prev.scrollEvents.slice(-4), `Scroll: ${globalThis.window.scrollY}px - ${new Date().toLocaleTimeString()}`]
      }))
    }

    updateDebugInfo()
    globalThis.window.addEventListener('resize', updateDebugInfo)
    globalThis.window.document.addEventListener('focusin', handleFocusIn)
    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      globalThis.window.removeEventListener('resize', updateDebugInfo)
      globalThis.window.document.removeEventListener('focusin', handleFocusIn)
      globalThis.window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (!import.meta.env.DEV) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs z-50">
      <div className="font-bold mb-2">Mobile Scroll Debug</div>
      <div className="space-y-1">
        <div>Width: {debugInfo.windowWidth}px</div>
        <div>Height: {debugInfo.windowHeight}px</div>
        <div>Mobile: {debugInfo.isMobile ? 'Yes' : 'No'}</div>
        <div>Scroll Y: {debugInfo.scrollY}px</div>
        {debugInfo.lastFocusEvent && (
          <div className="mt-2">
            <div className="font-semibold">Last Focus:</div>
            <div className="text-xs">{debugInfo.lastFocusEvent}</div>
          </div>
        )}
        {debugInfo.scrollEvents.length > 0 && (
          <div className="mt-2">
            <div className="font-semibold">Recent Scrolls:</div>
            {debugInfo.scrollEvents.map((event, index) => (
              <div key={index} className="text-xs">{event}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 