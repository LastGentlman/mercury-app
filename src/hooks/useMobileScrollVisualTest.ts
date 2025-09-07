import { useEffect, useState } from 'react'

/**
 * Visual test hook for mobile real device testing
 * This version shows visual indicators instead of console logs
 */
export const useMobileScrollVisualTest = () => {
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const newMessage = `[${timestamp}] ${message}`
    setDebugInfo(prev => [...prev.slice(-9), newMessage]) // Keep last 10 messages
    console.log('🎯', newMessage) // Also log to console
  }

  useEffect(() => {
    addDebugInfo('MOBILE SCROLL TEST HOOK LOADED!')
    addDebugInfo(`Device: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`)
    addDebugInfo(`Viewport: ${window.innerWidth}x${window.innerHeight}`)
    addDebugInfo(`Is Mobile: ${window.innerWidth <= 768}`)

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      addDebugInfo(`FOCUS: ${target.tagName} ${target.id || target.className}`)
      
      if (window.innerWidth <= 768) {
        addDebugInfo('MOBILE SCROLL ATTEMPTING...')
        
        setTimeout(() => {
          try {
            const rect = target.getBoundingClientRect()
            const scrollTop = window.pageYOffset + rect.top - 100
            
            addDebugInfo(`SCROLL TO: ${Math.max(0, scrollTop)}px`)
            
            window.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            })
            
            addDebugInfo('SCROLL COMMAND SENT!')
            
          } catch (error) {
            addDebugInfo(`SCROLL ERROR: ${error}`)
          }
        }, 300)
      } else {
        addDebugInfo('DESKTOP - NO SCROLL')
      }
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        addDebugInfo(`CLICK: ${target.tagName} ${target.id || 'no-id'}`)
      }
    }

    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement
      
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        addDebugInfo(`TOUCH: ${target.tagName} ${target.id || 'no-id'}`)
      }
    }

    addDebugInfo('Attaching event listeners...')
    
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleTouchStart)
    
    addDebugInfo('Event listeners attached!')
    
    return () => {
      addDebugInfo('Removing event listeners...')
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])

  // Return debug info for display
  return debugInfo
}
