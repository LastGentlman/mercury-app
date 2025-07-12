# PWA Icon Generation

This project includes an automated script to generate all necessary PWA (Progressive Web App) icons and assets.

## 🎨 What the script generates

The `generate-icons.sh` script creates:

- **Standard PWA icons** (192x192, 512x512) for app stores and home screens
- **Maskable icons** for Android adaptive icons with proper padding
- **Favicon** optimized for small sizes (16x16, 32x32)
- **Multi-resolution favicon.ico** for maximum browser compatibility
- **Updated manifest.json** with proper icon references

## 🚀 Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Generate all icons:**

   ```bash
   npm run generate-icons
   ```

   Or run the script directly

   ```bash
   chmod +x generate-icons.sh
   ./generate-icons.sh
   ```

## 📁 Generated Files

After running the script, you'll find:

```bash
public/
├── icons/
│   ├── apple-touch-icon.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── maskable-icon-192.png
│   └── maskable-icon-512.png
├── favicon.ico
├── favicon.svg (simplified version)
└── manifest.json (updated)
```

## 🎯 Icon Specifications

### Standard Icons

- **192x192**: Standard PWA icon
- **512x512**: High-resolution icon for app stores
- **Background**: Blue gradient (#3b82f6 to #1e40af)
- **Padding**: 10% for optimal display

### Maskable Icons

- **192x192 & 512x512**: Android adaptive icons
- **Background**: Solid blue (#3b82f6)
- **Padding**: 20% for safe area
- **Purpose**: "maskable" for Android adaptive icons

### Favicon

- **16x16 & 32x32**: Browser tab icons
- **Format**: ICO with multiple resolutions
- **Design**: Simplified version of the main logo

## 🔧 Customization

### Colors

Edit the script to change colors:

```bash
# Change background color
--background "#your-color"

# Change gradient in logo-optimized.svg
<stop offset="0" style="stop-color:#your-color"/>
<stop offset="1" style="stop-color:#your-dark-color"/>
```

### Logo Design

Modify `public/logo-optimized.svg` to change the icon design. The file should:

- Use a 512x512 viewBox
- Have clean, simple shapes
- Work well at small sizes
- Include proper padding for maskable icons

### Icon Sizes

Add or modify icon sizes in the script:

```bash
# Add custom size
npx pwa-asset-generator public/logo-optimized.svg public/icons \
  --background "#3b82f6" \
  --padding "10%" \
  --opaque false \
  --sizes 180,240,360
```

## 📱 PWA Features

The generated icons support:

- **iOS Safari**: Apple touch icons
- **Android Chrome**: Adaptive icons with maskable support
- **Windows**: Tiles and taskbar icons
- **macOS**: Dock icons
- **All browsers**: Favicon and tab icons

## 🔄 Updating Icons

To update icons after design changes:

1. Modify `public/logo-optimized.svg`
2. Run `npm run generate-icons`
3. The script will regenerate all icons and update the manifest

## 🛠️ Dependencies

The script uses these tools:

- `pwa-asset-generator`: Main icon generation
- `@resvg/resvg-js`: SVG to PNG conversion
- `png-to-ico`: Multi-resolution ICO creation

## 📋 Troubleshooting

### Permission Denied

```bash
chmod +x generate-icons.sh
```

### Missing Dependencies

```bash
npm install
```

### Icon Not Showing

- Clear browser cache
- Check manifest.json paths
- Verify icon files exist in public/icons/

### Poor Quality Icons

- Ensure logo-optimized.svg is high quality
- Check that viewBox is 512x512
- Verify padding settings are appropriate

## 🎨 Design Guidelines

For best results:

- Use simple, recognizable shapes
- Ensure good contrast with background
- Test at small sizes (16x16)
- Include proper padding for maskable icons
- Use consistent color scheme
- Avoid text in small icons

## 📚 Resources

- [PWA Asset Generator Documentation](https://github.com/onderceylan/pwa-asset-generator)
- [Web App Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Android Adaptive Icons](https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive)
- [iOS App Icons](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)
