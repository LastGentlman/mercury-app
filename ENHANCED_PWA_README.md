# Enhanced PWA Features

This document describes the enhanced Progressive Web App (PWA) features implemented in the Mercury App.

## 🚀 Enhanced PWA Detection

The app now includes multiple methods to detect if it's running as an installed PWA:

### Detection Methods

1. **Display Mode Detection** (Most Reliable)
   - Uses `window.matchMedia('(display-mode: standalone)')`
   - Works across all modern browsers

2. **iOS Safari Detection**
   - Checks `window.navigator.standalone`
   - Specific to iOS Safari

3. **URL Parameter Detection**
   - Checks for `utm_source=pwa` in URL
   - Useful for tracking PWA launches

4. **Start URL Parameter**
   - Checks for `source=pwa` in URL
   - Added to manifest.json start_url

### Usage

```typescript
import { isPWAInstalled, getPWALaunchMethod } from '../pwa'

// Check if running as PWA
const isInstalled = isPWAInstalled()

// Get launch method
const launchMethod = getPWALaunchMethod() // 'browser' | 'installed' | 'unknown'
```

## 📱 Installation Tracking

The app now tracks PWA installation state in localStorage:

### Functions

- `markAsInstalledPWA()` - Marks the app as installed
- `wasEverInstalledAsPWA()` - Checks if user previously installed the app

### Storage

- `pwa-installed` - Boolean flag
- `pwa-install-date` - ISO timestamp of installation

## 🔄 Enhanced Background Sync

### Features

1. **Background Sync Registration**
   - Automatically registers when service worker loads
   - Handles offline data synchronization

2. **Periodic Background Sync**
   - Registers for periodic sync (24-hour minimum interval)
   - Requires user permission

3. **Update Detection**
   - Detects when new service worker is available
   - Prompts user to reload for updates

### Service Worker Events

- `sync` - Background sync triggered
- `periodicsync` - Periodic background sync
- `updatefound` - New service worker detected

## 🎯 Components

### PWAInstallButton

Enhanced install button with:

- Smart detection of installation state
- Different text for first-time vs reinstall
- Automatic state updates

```tsx
import { PWAInstallButton } from './components/PWAInstallButton'

// Automatically shows/hides based on installation state
<PWAInstallButton />
```

### PWAStatus

Status indicator showing current launch method:

```tsx
import { PWAStatus } from './components/PWAStatus'

// Shows current PWA status
<PWAStatus />
```

## 🔧 Configuration

### Manifest.json Updates

```json
{
  "start_url": "/?source=pwa",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000"
}
```

### Service Worker

The service worker (`/public/sw.js`) handles:

- Static asset caching
- Background sync
- Offline data synchronization
- Update notifications

## 🐛 Debug Mode

In development mode, the PWA detection logs detailed information:

```javascript
🔍 PWA Detection: {
  isStandalone: true,
  isIOSStandalone: false,
  isLaunchedFromHomeScreen: false,
  hasStartUrlParam: true,
  isPWA: true,
  userAgent: "...",
  displayMode: "(display-mode: standalone)"
}
```

## 📊 Usage Examples

### Check PWA Status in Components

```tsx
import { useEffect, useState } from 'react'
import { isPWAInstalled, getPWALaunchMethod } from '../pwa'

function MyComponent() {
  const [isPWA, setIsPWA] = useState(false)
  const [launchMethod, setLaunchMethod] = useState('unknown')

  useEffect(() => {
    setIsPWA(isPWAInstalled())
    setLaunchMethod(getPWALaunchMethod())
  }, [])

  return (
    <div>
      {isPWA ? 'Running as PWA' : 'Running in browser'}
      <p>Launch method: {launchMethod}</p>
    </div>
  )
}
```

### Conditional Features Based on PWA Status

```tsx
import { isPWAInstalled } from '../pwa'

function ConditionalFeature() {
  const isPWA = isPWAInstalled()

  if (isPWA) {
    return <div>PWA-only feature</div>
  }

  return <div>Browser feature</div>
}
```

## 🔒 Security Considerations

- PWA detection is client-side only
- Installation tracking uses localStorage (user can clear)
- Background sync requires user permission
- Service worker runs in isolated context

## 🧪 Testing

### Development Testing

1. Open browser dev tools
2. Go to Application tab
3. Check "Service Workers" section
4. Test PWA detection in console:

   ```javascript
   import('./pwa').then(m => {
     console.log('Is PWA:', m.isPWAInstalled())
     console.log('Launch method:', m.getPWALaunchMethod())
   })
   ```

### Production Testing

1. Deploy to HTTPS
2. Install as PWA
3. Verify detection works
4. Test background sync functionality

## 📈 Analytics Integration

The enhanced detection can be used for analytics:

```typescript
import { getPWALaunchMethod, wasEverInstalledAsPWA } from '../pwa'

// Track PWA usage
const launchMethod = getPWALaunchMethod()
const wasEverInstalled = wasEverInstalledAsPWA()

analytics.track('app_launch', {
  launch_method: launchMethod,
  previously_installed: wasEverInstalled
})
```

## 🚀 Future Enhancements

Potential improvements:

- Push notifications
- App shortcuts
- File handling
- Share target
