#!/bin/bash

echo "🚀 Deploying with Cache Busting..."

# 1. Limpiar builds anteriores
echo "�� Cleaning previous builds..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/

# 2. Incrementar versión en package.json
echo "�� Updating version..."
npm version patch

# 3. Build con cache busting
echo "🔨 Building with cache busting..."
VITE_CACHE_BUST=$(date +%s) npm run build

# 4. Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 5. Actualizar service worker con nueva versión
echo "�� Updating service worker version..."
CURRENT_VERSION=$(node -p "require('./package.json').version")
sed -i "s/pedidolist-app-v[0-9]*/pedidolist-app-v${CURRENT_VERSION//\./}/g" dist/sw.js

# 6. Deploy a Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deploy completed with cache busting!"
echo "📱 Users will see the new version on next visit"
