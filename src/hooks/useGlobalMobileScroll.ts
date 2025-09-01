import { useEffect, useRef } from 'react'

export const useGlobalMobileScroll = () => {
  const isScrollingRef = useRef(false)
  const lastScrollTimeRef = useRef(0)

  useEffect(() => {
    const calculateOptimalOffset = () => {
      const viewportHeight = globalThis.window.innerHeight
      
      // Base offset - start with a smaller value
      let offset = 80
      
      // Adjust based on viewport height (for different mobile devices)
      if (viewportHeight < 600) {
        offset = 60 // Smaller screens need less offset
      } else if (viewportHeight > 800) {
        offset = 100 // Larger screens can have more offset
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
      
      // Only for inputs, textareas and selects
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      
      // Only on mobile (768px or less)
      if (globalThis.window.innerWidth > 768) return
      
      // Prevent multiple scrolls in quick succession
      const now = Date.now()
      if (now - lastScrollTimeRef.current < 500) return
      lastScrollTimeRef.current = now
      
      // Check if element is already visible in viewport
      const rect = target.getBoundingClientRect()
      const viewportHeight = globalThis.window.innerHeight
      const isVisible = rect.top >= 0 && rect.bottom <= viewportHeight
      
      // Calculate optimal offset
      const optimalOffset = calculateOptimalOffset()
      
      // If element is already visible and not too close to bottom, don't scroll
      if (isVisible && rect.bottom < viewportHeight - 200) return
      
      // Prevent scroll if already scrolling
      if (isScrollingRef.current) return
      
      isScrollingRef.current = true
      
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
        requestAnimationFrame(scrollToElement)
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

    globalThis.window.document.addEventListener('focusin', handleFocusIn)
    globalThis.window.addEventListener('resize', handleResize)
    globalThis.window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      globalThis.window.document.removeEventListener('focusin', handleFocusIn)
      globalThis.window.removeEventListener('resize', handleResize)
      globalThis.window.removeEventListener('scroll', handleScroll)
    }
  }, [])
} 