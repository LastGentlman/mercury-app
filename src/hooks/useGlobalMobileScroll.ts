import { useEffect, useRef } from 'react'

export const useGlobalMobileScroll = () => {
  const isScrollingRef = useRef(false)
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    // Log that the hook is loading
    console.log('🎯 useGlobalMobileScroll hook loaded!', {
      windowWidth: globalThis.window.innerWidth,
      isMobile: globalThis.window.innerWidth <= 768,
      userAgent: globalThis.navigator.userAgent,
      timestamp: new Date().toISOString()
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
      
      // Adjust based on viewport width (landscape vs portrait)
      if (viewportWidth < 400) {
        offset -= 10 // Very narrow screens need less offset
      } else if (viewportWidth > 500) {
        offset += 10 // Wider screens can have more offset
      }
      
      // Check for connection banner (sticky top-0)
      const connectionBanner = globalThis.document.querySelector('.sticky.top-0.z-50')
      if (connectionBanner) {
        const bannerHeight = connectionBanner.getBoundingClientRect().height
        offset += bannerHeight
      }
      
      // Check for header (if visible)
      const header = globalThis.document.querySelector('header')
      if (header && header.offsetParent !== null) { // Check if header is visible
        const headerHeight = header.getBoundingClientRect().height
        offset += headerHeight
      }
      
      // Add some padding for better visual comfort
      offset += 20
      
      return Math.max(60, Math.min(offset, 200)) // Keep between 60-200px
    }

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      // Debug logging for all focus events
      if (import.meta.env.DEV) {
        console.log('🎯 Focus event detected:', {
          tagName: target.tagName,
          id: target.id,
          windowWidth: globalThis.window.innerWidth,
          isMobile: globalThis.window.innerWidth <= 768
        })
      }
      
      // Only for inputs, textareas and selects
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (import.meta.env.DEV) {
          console.log('🎯 Skipping non-input element:', target.tagName)
        }
        return
      }
      
      // Only on mobile (768px or less)
      if (globalThis.window.innerWidth > 768) {
        if (import.meta.env.DEV) {
          console.log('🎯 Skipping desktop view:', globalThis.window.innerWidth + 'px')
        }
        return
      }
      
      // Prevent multiple scrolls in quick succession
      const now = Date.now()
      if (now - lastScrollTimeRef.current < 500) {
        if (import.meta.env.DEV) {
          console.log('🎯 Skipping - too soon since last scroll')
        }
        return
      }
      lastScrollTimeRef.current = now
      
      // Check if element is already visible in viewport
      const rect = target.getBoundingClientRect()
      const viewportHeight = globalThis.window.innerHeight
      const isVisible = rect.top >= 0 && rect.bottom <= viewportHeight
      
      // Calculate optimal offset
      const optimalOffset = calculateOptimalOffset()
      
      // If element is already visible and not too close to bottom, don't scroll
      if (isVisible && rect.bottom < viewportHeight - 200) {
        if (import.meta.env.DEV) {
          console.log('🎯 Skipping - element already visible')
        }
        return
      }
      
      // Prevent scroll if already scrolling
      if (isScrollingRef.current) {
        if (import.meta.env.DEV) {
          console.log('🎯 Skipping - already scrolling')
        }
        return
      }
      
      isScrollingRef.current = true
      
      if (import.meta.env.DEV) {
        console.log('🎯 Proceeding with scroll for:', target.tagName, target.id)
      }
      
      // Use requestAnimationFrame for better timing
      const scrollToElement = () => {
        try {
          const rect = target.getBoundingClientRect()
          const scrollTop = globalThis.window.pageYOffset + rect.top - optimalOffset
          
          // Debug logging in development
          if (import.meta.env.DEV) {
            console.log('🎯 Mobile Scroll Debug:', {
              element: target.tagName,
              id: target.id,
              rectTop: rect.top,
              pageYOffset: globalThis.window.pageYOffset,
              optimalOffset,
              finalScrollTop: Math.max(0, scrollTop),
              viewportHeight: globalThis.window.innerHeight
            })
          }
          
          globalThis.window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
          
          // Reset scrolling flag after animation
          setTimeout(() => {
            isScrollingRef.current = false
          }, 1000)
          
        } catch (error) {
          console.warn('Mobile scroll error:', error)
          isScrollingRef.current = false
        }
      }
      
      // Delay to allow virtual keyboard to appear first
      setTimeout(() => {
        // Double-check that we're still on mobile and element is still focused
        if (globalThis.window.innerWidth <= 768 && document.activeElement === target) {
          requestAnimationFrame(scrollToElement)
        } else {
          if (import.meta.env.DEV) {
            console.log('🎯 Skipping scroll - conditions changed during delay')
          }
          isScrollingRef.current = false
        }
      }, 400) // Increased delay for better keyboard handling
    }

    const handleResize = () => {
      // Reset scrolling flag on resize
      isScrollingRef.current = false
    }

    const handleScroll = () => {
      // Reset scrolling flag when user manually scrolls
      isScrollingRef.current = false
    }

    // Log event listener attachment
    console.log('🎯 Attaching event listeners for mobile scroll')
    
    globalThis.window.document.addEventListener('focusin', handleFocusIn)
    globalThis.window.addEventListener('resize', handleResize)
    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    
    console.log('🎯 Event listeners attached successfully')
    
    return () => {
      console.log('🎯 Removing event listeners for mobile scroll')
      globalThis.window.document.removeEventListener('focusin', handleFocusIn)
      globalThis.window.removeEventListener('resize', handleResize)
      globalThis.window.removeEventListener('scroll', handleScroll)
    }
  }, [])
} 