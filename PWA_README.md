# PWA Setup for Mercury App

This app has been configured as a Progressive Web App (PWA) with the following features:

## Features

- ✅ Service Worker for offline functionality
- ✅ Web App Manifest for app-like experience
- ✅ Install prompt for desktop and mobile
- ✅ Offline caching of assets
- ✅ Automatic updates
- ✅ App-like navigation
- ✅ Background Sync for offline data
- ✅ Periodic Background Sync (when supported)
- ✅ Real-time sync status indicators
- ✅ Automatic retry mechanism
- ✅ Conflict resolution

## PWA Configuration

### Manifest.json

- App name: "Mercury App"
- Short name: "Mercury"
- Theme color: #000000
- Background color: #ffffff
- Display mode: standalone
- Icons: 192x192 and 512x512 with maskable support

### Service Worker

- Automatic registration in production
- Caches static assets (JS, CSS, HTML, images)
- Runtime caching for external resources
- Automatic updates with user prompt
- Background Sync for offline data synchronization
- Periodic Background Sync for automatic sync
- Conflict resolution and retry mechanism

### Install Button

- Floating install button appears when app can be installed
- Only shows on supported browsers/devices
- Automatically hides when app is already installed

## Testing PWA Features

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm run serve
```

### Testing PWA Features Step-by-Step

1. **Install Prompt**: 
   - Open the app in Chrome/Edge
   - Look for the install button in the bottom-right corner
   - Or use the browser's install option in the address bar

2. **Offline Functionality**:
   - Build and serve the production version
   - Open Chrome DevTools → Application → Service Workers
   - Check "Offline" in the Network tab
   - Refresh the page - it should still work

3. **Background Sync**:
   - Make changes while offline
   - Go back online - sync should happen automatically
   - Check the sync status indicator in the bottom-left corner
   - Background sync works even when the app is closed

4. **App-like Experience**:

   - Install the app on desktop/mobile
   - It should open in a standalone window without browser UI

5. **Updates**:

   - Make changes to the app
   - Rebuild and deploy
   - Users will see an update prompt when they visit

6. **Background Sync Testing**:

   - Use Chrome DevTools → Application → Background Services
   - Check "Background Sync" section
   - Monitor sync events and status
   - Test with network throttling

## Browser Support

- ✅ Chrome/Edge (full PWA support + Background Sync)
- ✅ Firefox (basic PWA support, limited Background Sync)
- ✅ Safari (limited PWA support, no Background Sync)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ⚠️ Background Sync requires HTTPS in production

## PWA Score

To check your PWA score, use Lighthouse in Chrome DevTools:

1. Open DevTools → Lighthouse
2. Select "Progressive Web App"
3. Run audit

The app should score 90+ on PWA metrics.

## Customization

### Icons

Replace the icons in `/public/`:

- `favicon.ico` (16x16, 32x32, 48x48)
- `logo192.png` (192x192)
- `logo512.png` (512x512)

### Colors

Update colors in:

- `public/manifest.json`
- `index.html` meta tags
- `vite.config.ts` PWA config

### Caching

Modify caching strategies in `vite.config.ts`:

- `globPatterns` for static assets
- `runtimeCaching` for external resources

### Background Sync

Configure sync settings in `src/config/backgroundSync.ts`:

- `MAX_RETRIES` for failed sync attempts
- `BATCH_SIZE` for sync performance
- `SYNC_TIMEOUT` for sync operations
- `MIN_INTERVAL` for periodic sync

## Troubleshooting

### Service Worker Not Registering

- Ensure you're running production build
- Check browser console for errors
- Verify HTTPS in production

### Install Button Not Showing

- Check if browser supports PWA
- Verify manifest.json is valid
- Ensure app meets install criteria

### Offline Not Working

- Check service worker registration
- Verify assets are being cached
- Test with production build only

### Background Sync Not Working

- Ensure HTTPS in production
- Check browser support for Background Sync
- Verify service worker is registered
- Check Chrome DevTools → Application → Background Services
- Ensure user is authenticated 