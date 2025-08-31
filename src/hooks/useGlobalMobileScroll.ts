import { useEffect } from 'react'

export const useGlobalMobileScroll = () => {
  useEffect(() => {
    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      
      // Solo para inputs, textareas y selects
      if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      
      // Solo en móvil (768px o menos)
      if (globalThis.window.innerWidth > 768) return
      
      // Delay para que aparezca el teclado virtual primero
      setTimeout(() => {
        const rect = target.getBoundingClientRect()
        const scrollTop = globalThis.window.pageYOffset + rect.top - 120 // 120px desde el top
        
        globalThis.window.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        })
      }, 300)
    }

    globalThis.window.document.addEventListener('focusin', handleFocusIn)
    return () => globalThis.window.document.removeEventListener('focusin', handleFocusIn)
  }, [])
} 