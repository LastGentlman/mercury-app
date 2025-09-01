import { useState, useEffect } from 'react'

export const MobileScrollDebugger = () => {
  const [debugInfo, setDebugInfo] = useState({
    windowWidth: 0,
    windowHeight: 0,
    isMobile: false,
    scrollY: 0,
    lastFocusEvent: null as string | null,
    scrollEvents: [] as string[],
    calculatedOffset: 0,
    headerHeight: 0,
    bannerHeight: 0
  })

  const calculateOptimalOffset = () => {
    const viewportHeight = globalThis.window.innerHeight
    const viewportWidth = globalThis.window.innerWidth
    
    // Base offset - start with a smaller value
    let offset = 80
    
    // Adjust based on viewport height (for different mobile devices)
    if (viewportHeight < 600) {
      offset = 60 // Smaller screens need less offset
    } else if (viewportHeight > 800) {
      offset = 100 // Larger screens can have more offset
    }
    
    // Adjust based on viewport width (for different orientations)
    if (viewportWidth < 400) {
      offset += 10 // Narrow screens need extra offset
    } else if (viewportWidth > 600) {
      offset -= 10 // Wide screens can use less offset
    }
    
    // Check for connection banner (sticky top-0)
    const connectionBanner = globalThis.document.querySelector('.sticky.top-0.z-50')
    let bannerHeight = 0
    if (connectionBanner) {
      bannerHeight = connectionBanner.getBoundingClientRect().height
      offset += bannerHeight
    }
    
    // Check for header (if visible)
    const header = globalThis.document.querySelector('header')
    let headerHeight = 0
    if (header && header.offsetParent !== null) { // Check if header is visible
      headerHeight = header.getBoundingClientRect().height
      offset += headerHeight
    }
    
    // Add some padding for better visual comfort
    offset += 20
    
    const finalOffset = Math.max(60, Math.min(offset, 200)) // Keep between 60-200px
    
    return { finalOffset, headerHeight, bannerHeight }
  }

  useEffect(() => {
    const updateDebugInfo = () => {
      const { finalOffset, headerHeight, bannerHeight } = calculateOptimalOffset()
      setDebugInfo(prev => ({
        ...prev,
        windowWidth: globalThis.window.innerWidth,
        windowHeight: globalThis.window.innerHeight,
        isMobile: globalThis.window.innerWidth <= 768,
        scrollY: globalThis.window.scrollY,
        calculatedOffset: finalOffset,
        headerHeight,
        bannerHeight
      }))
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      const { finalOffset } = calculateOptimalOffset()
      setDebugInfo(prev => ({
        ...prev,
        lastFocusEvent: `${target.tagName} (${target.id || 'no-id'}) - Offset: ${finalOffset}px - ${new Date().toLocaleTimeString()}`,
        calculatedOffset: finalOffset
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
        <div className="border-t border-gray-600 pt-1 mt-1">
          <div className="font-semibold">Positioning:</div>
          <div>Offset: {debugInfo.calculatedOffset}px</div>
          <div>Header: {debugInfo.headerHeight}px</div>
          <div>Banner: {debugInfo.bannerHeight}px</div>
        </div>
        {debugInfo.lastFocusEvent && (
          <div className="mt-2 border-t border-gray-600 pt-1">
            <div className="font-semibold">Last Focus:</div>
            <div className="text-xs">{debugInfo.lastFocusEvent}</div>
          </div>
        )}
        {debugInfo.scrollEvents.length > 0 && (
          <div className="mt-2 border-t border-gray-600 pt-1">
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