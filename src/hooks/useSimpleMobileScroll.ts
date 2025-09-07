import { useEffect } from 'react'

/**
 * Simplified version of mobile scroll hook for debugging
 * This version has minimal logic to isolate the issue
 */
export const useSimpleMobileScroll = () => {
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      console.log('🎯 Simple Focus event:', {
        tagName: target.tagName,
        id: target.id,
        windowWidth: window.innerWidth,
        isMobile: window.innerWidth <= 768
      })
      
      // Only for inputs, textareas and selects
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        console.log('🎯 Skipping non-input element:', target.tagName)
        return
      }
      
      // Only on mobile (768px or less)
      if (window.innerWidth > 768) {
        console.log('🎯 Skipping desktop view:', window.innerWidth + 'px')
        return
      }
      
      console.log('🎯 Proceeding with simple scroll for:', target.tagName, target.id)
      
      // Simple scroll logic
      setTimeout(() => {
        try {
          const rect = target.getBoundingClientRect()
          const scrollTop = window.pageYOffset + rect.top - 100 // Fixed 100px offset
          
          console.log('🎯 Simple scroll attempt:', {
            rectTop: rect.top,
            pageYOffset: window.pageYOffset,
            finalScrollTop: Math.max(0, scrollTop)
          })
          
          window.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
          
        } catch (error) {
          console.warn('Simple mobile scroll error:', error)
        }
      }, 300)
    }

    document.addEventListener('focusin', handleFocusIn)
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [])
}
