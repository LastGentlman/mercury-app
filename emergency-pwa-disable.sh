#!/bin/bash

echo "🚨 EMERGENCY PWA DISABLE SCRIPT"
echo "================================"

# Create .env.local with PWA disabled
echo "📝 Creating .env.local with PWA disabled..."
cat > .env.local << 'EOF'
# Emergency PWA disable flag
VITE_PWA_DISABLED=true
EOF

echo "✅ PWA disabled via environment variable"
echo ""
echo "🔧 Next steps:"
echo "1. Stop your development server (Ctrl+C)"
echo "2. Clear browser cache and service workers:"
echo "   - Open Chrome DevTools (F12)"
echo "   - Go to Application tab → Storage"
echo "   - Click 'Clear site data'"
echo "   - Go to Application tab → Service Workers"
echo "   - Click 'Unregister' on any existing service workers"
echo "3. Restart your development server: npm run dev"
echo ""
echo "🔄 To re-enable PWA later:"
echo "1. Set VITE_PWA_DISABLED=false in .env.local"
echo "2. Or delete the .env.local file"
echo ""
echo "✅ Emergency PWA disable completed!" 