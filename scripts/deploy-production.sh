#!/bin/bash

echo "�� Deploying to production with cache busting..."

# 1. Limpiar builds anteriores
echo "�� Cleaning previous builds..."
rm -rf dist/
rm -rf .vite/

# 2. Build sin PWA
echo "🔨 Building without PWA..."
VITE_PWA_DISABLED=true npm run build

# 3. Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ Build failed!"
    exit 1
fi

# 4. Crear archivo de limpieza de cache
echo "📝 Creating cache cleanup script..."
cat > dist/clear-cache.js << 'EOF'
// Script para limpiar cache en producción
console.log('�� Clearing production cache...');

// Limpiar service workers
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('✅ Service Worker unregistered');
    });
  });
}

// Limpiar caches
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    cacheNames.forEach(cacheName => {
      caches.delete(cacheName);
      console.log('✅ Cache deleted:', cacheName);
    });
  });
}

// Limpiar localStorage
Object.keys(localStorage).forEach(key => {
  if (key.includes('pedidolist') || key.includes('v1') || key.includes('v2')) {
    localStorage.removeItem(key);
    console.log('✅ LocalStorage cleared:', key);
  }
});

console.log('✅ Cache cleanup completed. Reloading page...');
setTimeout(() => window.location.reload(), 1000);
EOF

# 5. Deploy a Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deploy completed!"
echo "📱 Users can visit: https://tu-dominio.com/clear-cache.js to clear cache"
