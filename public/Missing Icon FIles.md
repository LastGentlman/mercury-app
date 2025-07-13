# Missing Icon Files

## Required for PWA Manifest

1. **`favicon.ico`** - Referenced in manifest.json and service worker
   - Sizes: 64x64, 32x32, 24x24, 16x16
   - Type: image/x-icon

2. **`logo192.png`** - Referenced in manifest.json and service worker
   - Size: 192x192 pixels
   - Type: image/png
   - Purpose: any maskable

3. **`logo512.png`** - Referenced in manifest.json and service worker
   - Size: 512x512 pixels
   - Type: image/png
   - Purpose: any maskable

### Current Icon Files You Have

- `favicon.svg` ✅
- `logo-optimized.svg` ✅
- `mask-icon.svg` ✅

## Where These Icons Are Referenced

### In `manifest.json`

```json
"icons": [
  {
    "src": "favicon.ico",
    "sizes": "64x64 32x32 24x24 16x16",
    "type": "image/x-icon"
  },
  {
    "src": "logo192.png",
    "type": "image/png",
    "sizes": "192x192",
    "purpose": "any maskable"
  },
  {
    "src": "logo512.png",
    "type": "image/png",
    "sizes": "512x512",
    "purpose": "any maskable"
  }
]
```

### In `sw.js` (Service Worker)

```javascript
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];
```

### In `index.html`

```html
<link rel="icon" href="/favicon.ico" />
```

## Recommended Icon Sizes for PWA

- **16x16** - Favicon
- **32x32** - Favicon
- **192x192** - Android home screen
- **512x512** - Android splash screen
- **180x180** - Apple touch icon (optional)
- **152x152** - Apple touch icon (optional)

You can generate these icons from your existing `logo-optimized.svg` file using online tools like:

- [PWA Builder](https://www.pwabuilder.com/imageGenerator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

Once you have these icon files, place them in the `mercury-app/public/` directory and your PWA should work correctly!
