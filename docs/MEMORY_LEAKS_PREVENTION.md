# 🚨 Prevención de Memory Leaks en Event Listeners

## ❌ **PROBLEMAS COMUNES**

### 1. Event Listeners Sin Cleanup

```typescript
// ❌ PROBLEMA: Event listeners sin cleanup adecuado
beforeInstallPromptListener = (e: Event) => {
  e.preventDefault();
  (window as any).deferredPrompt = e;
};

// Falta cleanup en useEffect
window.addEventListener('beforeinstallprompt', beforeInstallPromptListener);
// ❌ No hay cleanup en unmount
```

### 2. Múltiples Event Listeners para el Mismo Evento

```typescript
// ❌ PROBLEMA: Múltiples listeners para el mismo evento
navigator.serviceWorker.addEventListener('message', handleMessage)
navigator.serviceWorker.addEventListener('message', handleAuthTokenRequest)
// ❌ Esto causa memory leaks porque se acumulan listeners
```

### 3. Referencias a Funciones que Cambian

```typescript
// ❌ PROBLEMA: Función inline que cambia en cada render
useEffect(() => {
  const handler = () => console.log('Event!')
  window.addEventListener('resize', handler)
  return () => window.removeEventListener('resize', handler)
}, []) // ❌ La función se recrea en cada render
```

## ✅ **SOLUCIONES IMPLEMENTADAS**

### 1. Hook Personalizado `useEventListener`

```typescript
// ✅ SOLUCIÓN: Hook seguro que maneja cleanup automáticamente
import { useWindowEventListener } from '../hooks/useEventListener'

export function MyComponent() {
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    setCanInstall(true)
  }

  // ✅ Cleanup automático, sin memory leaks
  useWindowEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
}
```

### 2. Un Solo Handler para Múltiples Casos

```typescript
// ✅ SOLUCIÓN: Un solo handler que maneja múltiples tipos de mensajes
const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
  const { type } = event.data

  // ✅ Manejar petición de auth token
  if (type === 'GET_AUTH_TOKEN' && event.ports[0]) {
    const token = localStorage.getItem('authToken')
    event.ports[0].postMessage({ token })
    return
  }

  // ✅ Manejar mensajes de sync
  switch (type) {
    case 'SYNC_STARTED':
      // ...
    case 'SYNC_COMPLETED':
      // ...
  }
}, [])
```

### 3. useCallback para Handlers Estables

```typescript
// ✅ SOLUCIÓN: useCallback para mantener referencia estable
const handleOnline = useCallback(() => {
  setIsOnline(true)
  console.log('🌐 Conexión restaurada')
}, [])

const handleOffline = useCallback(() => {
  setIsOnline(false)
  console.log('📴 Sin conexión')
}, [])

useWindowEventListener('online', handleOnline)
useWindowEventListener('offline', handleOffline)
```

## 🛠️ **HOOKS SEGUROS DISPONIBLES**

### `useEventListener`

```typescript
useEventListener<T extends EventTarget>(
  target: T | null | undefined,
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
)
```

### `useWindowEventListener`

```typescript
useWindowEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
)
```

### `useDocumentEventListener`

```typescript
useDocumentEventListener(
  eventName: string,
  handler: (event: Event) => void,
  options?: AddEventListenerOptions
)
```

### `useServiceWorkerEventListener`

```typescript
useServiceWorkerEventListener(
  eventName: string,
  handler: (event: MessageEvent) => void,
  options?: AddEventListenerOptions
)
```

## 📋 **CHECKLIST DE VERIFICACIÓN**

### ✅ Antes de Implementar Event Listeners

- [ ] ¿Necesito realmente este event listener?
- [ ] ¿Puedo usar uno de los hooks seguros disponibles?
- [ ] ¿El handler está envuelto en useCallback?
- [ ] ¿Hay cleanup apropiado en useEffect?

### ✅ Durante la Implementación

- [ ] ¿Estoy usando el hook correcto para el target?
- [ ] ¿El handler maneja todos los casos necesarios?
- [ ] ¿Hay manejo de errores apropiado?
- [ ] ¿Los tipos TypeScript son correctos?

### ✅ Después de la Implementación

- [ ] ¿Los tests pasan?
- [ ] ¿No hay warnings en la consola?
- [ ] ¿El componente se desmonta correctamente?
- [ ] ¿No hay memory leaks detectados?

## 🔍 **DETECCIÓN DE MEMORY LEAKS**

### Herramientas de Desarrollo

1. **Chrome DevTools Memory Tab**
   - Take heap snapshot
   - Compare snapshots
   - Look for detached DOM trees

2. **React DevTools Profiler**
   - Record renders
   - Check for unnecessary re-renders
   - Monitor component lifecycle

3. **Lighthouse Performance Audit**
   - Memory usage analysis
   - Performance metrics
   - Best practices recommendations

### Señales de Memory Leaks

- Consumo de memoria que crece constantemente
- Event listeners que se acumulan
- Componentes que no se desmontan
- Warnings en la consola sobre event listeners

## 🚀 **MEJORES PRÁCTICAS**

### 1. Siempre Usar Hooks Seguros

```typescript
// ✅ BUENO
useWindowEventListener('resize', handleResize)

// ❌ EVITAR
window.addEventListener('resize', handleResize)
```

### 2. Usar useCallback para Handlers

```typescript
// ✅ BUENO
const handleResize = useCallback(() => {
  setWindowSize({ width: window.innerWidth, height: window.innerHeight })
}, [])

// ❌ EVITAR
const handleResize = () => {
  setWindowSize({ width: window.innerWidth, height: window.innerHeight })
}
```

### 3. Un Solo Handler por Evento

```typescript
// ✅ BUENO
const handleMessage = useCallback((event: MessageEvent) => {
  switch (event.data.type) {
    case 'AUTH_TOKEN':
      handleAuthToken(event)
      break
    case 'SYNC':
      handleSync(event)
      break
  }
}, [])

// ❌ EVITAR
useServiceWorkerEventListener('message', handleAuthToken)
useServiceWorkerEventListener('message', handleSync)
```

### 4. Cleanup Explícito Cuando Sea Necesario

```typescript
// ✅ BUENO
useEffect(() => {
  const interval = setInterval(updateData, 5000)
  return () => clearInterval(interval)
}, [])
```

## 📚 **REFERENCIAS**

- [React useEffect Cleanup](https://react.dev/reference/react/useEffect#cleaning-up-an-effect)
- [Event Listener Memory Leaks](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#memory_issues)
- [Chrome DevTools Memory](https://developer.chrome.com/docs/devtools/memory/)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools#profiler-tab)
