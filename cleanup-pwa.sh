#!/bin/bash

echo "🧹 Cleaning up PWA and Service Worker issues..."

# Remove existing build
echo "🗑️ Removing existing build..."
rm -rf dist/

# Remove node_modules and reinstall
echo "🔄 Reinstalling dependencies..."
rm -rf node_modules/
npm install

# Build the project
echo "🏗️ Building project..."
npm run build

# Clear browser caches (instructions for user)
echo "✅ Build completed!"
echo ""
echo "📋 Next steps to test:"
echo "1. Open browser DevTools (F12)"
echo "2. Go to Application tab"
echo "3. Clear all storage:"
echo "   - Clear Storage > Clear site data"
echo "   - Service Workers > Unregister all"
echo "   - Storage > Clear all"
echo "4. Hard refresh the page (Ctrl+Shift+R)"
echo "5. Test account deletion again"
echo ""
echo "🔧 If issues persist, try:"
echo "- Disable PWA: Set VITE_PWA_DISABLED=true in .env"
echo "- Use incognito/private browsing mode"
