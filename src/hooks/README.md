# Hooks Documentation

## usePWARoute

A React hook that handles PWA-specific routing logic. It automatically redirects unauthenticated users to the login page when they open the app as a PWA (Progressive Web App) and are on the home page.

### Usage

```tsx
import { usePWARoute } from '../hooks/usePWARoute'

function MyComponent() {
  const { isPWA, isAuthenticated, isLoading } = usePWARoute()
  
  return (
    <div>
      {isPWA && <div>📱 Running as PWA</div>}
      {isLoading && <div>Loading...</div>}
      {!isLoading && !isAuthenticated && <div>Please log in</div>}
    </div>
  )
}
```

### Behavior

The hook automatically:

1. **Waits for authentication to load** - Prevents premature redirects
2. **Checks if the app is running as PWA** - Uses `isPWAInstalled()` from the PWA utilities
3. **Redirects unauthenticated PWA users** - When on the home page (`/`), redirects to `/auth`
4. **Does nothing for regular browser users** - Only affects PWA installations

### Return Values

- `isPWA: boolean` - Whether the app is currently running as a PWA
- `isAuthenticated: boolean` - Whether the user is authenticated
- `isLoading: boolean` - Whether authentication is still loading

### Integration

The hook is designed to work with:

- `@tanstack/react-router` for navigation
- `useAuth` hook for authentication state
- PWA utilities for detecting PWA installation

### Example Integration

```tsx
// In your home page component
import { usePWARoute } from '../hooks/usePWARoute'

function HomePage() {
  const { isPWA } = usePWARoute()
  
  return (
    <div>
      {isPWA && (
        <div className="pwa-indicator">
          📱 PWA Mode
        </div>
      )}
      {/* Rest of your home page content */}
    </div>
  )
}
```

The hook will automatically handle the redirect logic, so you only need to use the returned values for UI purposes.
