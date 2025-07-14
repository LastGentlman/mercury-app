import { useEffect, useRef } from 'react'

/**
 * Hook personalizado para manejar event listeners de manera segura
 * Previene memory leaks y asegura cleanup apropiado
 */
export function useEventListener<T extends EventTarget>(
  target: T | null | undefined,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler)

  // Actualizar la referencia del handler si cambia
  useEffect(() => {
    savedHandler.current = handler
  }, [handler])

  useEffect(() => {
    // No hacer nada si no hay target
    if (!target) {
      return
    }

    // Función wrapper que usa la referencia actual del handler
    const eventListener = (event: Event) => {
      savedHandler.current(event)
    }

    // Agregar event listener
    target.addEventListener(eventName, eventListener, options)

    // Cleanup: remover event listener
    return () => {
      target.removeEventListener(eventName, eventListener, options)
    }
  }, [target, eventName, options])
}

/**
 * Hook especializado para window event listeners
 */
export function useWindowEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
) {
  return useEventListener(typeof window !== 'undefined' ? window : null, eventName, handler, options)
}

/**
 * Hook especializado para document event listeners
 */
export function useDocumentEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
) {
  return useEventListener(typeof document !== 'undefined' ? document : null, eventName, handler, options)
}

/**
 * Hook especializado para service worker event listeners
 */
export function useServiceWorkerEventListener(
  eventName: string,
  handler: (event: MessageEvent) => void,
  options?: AddEventListenerOptions
) {
  const serviceWorker = useRef<ServiceWorkerContainer | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      serviceWorker.current = navigator.serviceWorker
    }
  }, [])

  return useEventListener(serviceWorker.current, eventName, handler as (event: Event) => void, options)
} 