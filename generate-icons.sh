#!/bin/bash
# generate-icons.sh - Script para generar todos los iconos PWA

echo "🎨 Generando iconos PWA optimizados..."

# Crear directorio si no existe
mkdir -p public/icons

# Generar iconos estándar con --no-sandbox para evitar problemas de Chrome
echo "📱 Generando iconos estándar..."
npx pwa-asset-generator public/logo-optimized.svg public/icons \
  --background "#3b82f6" \
  --padding "10%" \
  --opaque false \
  --index public/index.html \
  --manifest public/manifest.json \
  --no-sandbox \
  --disable-web-security \
  --disable-features=VizDisplayCompositor

# Generar iconos maskable (Android adaptive)
echo "🎭 Generando iconos maskable..."
npx pwa-asset-generator public/logo-optimized.svg public/icons \
  --background "#3b82f6" \
  --padding "20%" \
  --opaque true \
  --maskable true \
  --type png \
  --name "maskable" \
  --no-sandbox \
  --disable-web-security \
  --disable-features=VizDisplayCompositor

# Generar favicon específico (más simple para tamaños micro)
echo "🌐 Generando favicon..."
cat > public/favicon.svg << 'EOF'
<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="7" fill="#3b82f6"/>
  <rect x="8" y="6" width="16" height="20" rx="2" fill="#fff"/>
  <circle cx="11" cy="12" r="1.5" fill="#10b981"/>
  <rect x="14" y="11" width="7" height="2" rx="1" fill="#10b981" opacity=".6"/>
  <circle cx="11" cy="16" r="1.5" fill="#f59e0b"/>
  <rect x="14" y="15" width="8" height="2" rx="1" fill="#f59e0b" opacity=".6"/>
  <circle cx="11" cy="20" r="1.5" fill="none" stroke="#6b7280"/>
  <rect x="14" y="19" width="6" height="2" rx="1" fill="#6b7280" opacity=".4"/>
</svg>
EOF

# Convertir favicon.svg a PNG usando resvg-js
echo "🔄 Convirtiendo favicon a PNG..."
deno run --allow-read --allow-write scripts/convert-favicon.ts

# Crear favicon.ico multi-resolución solo si los PNG existen
if [ -f "public/favicon-16.png" ] && [ -f "public/favicon-32.png" ]; then
  echo "📄 Creando favicon.ico..."
  npx png-to-ico public/favicon-16.png public/favicon-32.png -o public/favicon.ico
else
  echo "⚠️  PNG files not found, skipping ICO generation"
fi

echo "✅ Iconos generados:"
echo "   📱 PWA icons: public/icons/"
if [ -f "public/favicon.ico" ]; then
  echo "   🌐 Favicon: public/favicon.ico"
else
  echo "   🌐 Favicon: public/favicon.svg (PNG conversion failed)"
fi
echo "   📄 Manifest: public/manifest.json actualizado"

# Limpiar archivos temporales si existen
if [ -f "public/favicon-16.png" ]; then
  rm public/favicon-16.png
fi
if [ -f "public/favicon-32.png" ]; then
  rm public/favicon-32.png
fi

echo "🚀 ¡Listo para producción!" 