import { useEffect } from 'react'

/**
 * Test hook specifically for mobile real device testing
 * This version has aggressive logging and simplified logic
 */
export const useMobileScrollTest = () => {
  useEffect(() => {
    console.log('🚀 MOBILE SCROLL TEST HOOK LOADED!')
    console.log('📱 Device Info:', {
      userAgent: navigator.userAgent,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      isMobile: window.innerWidth <= 768,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled
    })

    // Test function that runs immediately
    const testFunction = () => {
      console.log('🧪 Test function executed!')
      console.log('📱 Current viewport:', window.innerWidth + 'x' + window.innerHeight)
    }

    // Run test immediately
    testFunction()

    // Test focus handler
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      console.log('🎯 FOCUS EVENT DETECTED!', {
        tagName: target.tagName,
        id: target.id,
        className: target.className,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        isMobile: window.innerWidth <= 768,
        timestamp: new Date().toISOString()
      })
      
      // Always try to scroll on mobile, regardless of element type
      if (window.innerWidth <= 768) {
        console.log('🎯 MOBILE DEVICE DETECTED - ATTEMPTING SCROLL')
        
        setTimeout(() => {
          try {
            const rect = target.getBoundingClientRect()
            const scrollTop = window.pageYOffset + rect.top - 100
            
            console.log('🎯 SCROLL ATTEMPT:', {
              rectTop: rect.top,
              pageYOffset: window.pageYOffset,
              finalScrollTop: Math.max(0, scrollTop),
              targetElement: target.tagName + (target.id ? '#' + target.id : '')
            })
            
            window.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            })
            
            console.log('🎯 SCROLL COMMAND SENT!')
            
          } catch (error) {
            console.error('🎯 SCROLL ERROR:', error)
          }
        }, 300)
      } else {
        console.log('🎯 DESKTOP DEVICE - NO SCROLL')
      }
    }

    // Test click handler as backup
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        console.log('🎯 CLICK ON INPUT DETECTED!', {
          tagName: target.tagName,
          id: target.id,
          windowWidth: window.innerWidth,
          isMobile: window.innerWidth <= 768
        })
      }
    }

    // Test touch handler
    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement
      
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        console.log('🎯 TOUCH ON INPUT DETECTED!', {
          tagName: target.tagName,
          id: target.id,
          windowWidth: window.innerWidth,
          isMobile: window.innerWidth <= 768
        })
      }
    }

    console.log('🎯 Attaching test event listeners...')
    
    // Attach multiple event listeners for testing
    document.addEventListener('focusin', handleFocusIn)
    document.addEventListener('click', handleClick)
    document.addEventListener('touchstart', handleTouchStart)
    
    // Test if document is ready
    console.log('🎯 Document ready state:', document.readyState)
    console.log('🎯 Document body exists:', !!document.body)
    console.log('🎯 Document has inputs:', document.querySelectorAll('input, textarea, select').length)
    
    console.log('🎯 Test event listeners attached!')
    
    return () => {
      console.log('🎯 Removing test event listeners...')
      document.removeEventListener('focusin', handleFocusIn)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchstart', handleTouchStart)
    }
  }, [])
}
