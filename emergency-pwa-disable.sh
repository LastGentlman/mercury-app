#!/bin/bash

echo "🚨 EMERGENCY PWA FIX - Limpiando configuración problemática..."

# 1. Limpiar completamente el build anterior
echo "🧹 Limpiando builds anteriores..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/

# 2. Limpiar service workers del navegador (manual)
echo "⚠️  ACCIÓN MANUAL REQUERIDA:"
echo "   1. Abre Chrome DevTools (F12)"
echo "   2. Ve a Application > Storage"
echo "   3. Click en 'Clear site data'"
echo "   4. Ve a Application > Service Workers"
echo "   5. Click 'Unregister' en todos los SW"
echo ""

# 3. Crear archivo temporal de configuración PWA deshabilitada
echo "🔧 Creando configuración temporal..."
cat > .env.emergency << 'EOF'
# CONFIGURACIÓN DE EMERGENCIA - PWA DESHABILITADA
VITE_PWA_DISABLED=true
VITE_ENVIRONMENT=development
EOF

# 4. Backup del vite.config.ts actual
if [ -f "vite.config.ts" ]; then
    echo "💾 Haciendo backup de vite.config.ts..."
    cp vite.config.ts vite.config.ts.backup
fi

# 5. Mensaje de instrucciones
echo ""
echo "✅ PASOS DE RECUPERACIÓN:"
echo ""
echo "1. REEMPLAZA tu vite.config.ts con la configuración optimizada del artifact"
echo ""
echo "2. INSTALA dependencias limpias:"
echo "   rm -rf node_modules/ package-lock.json"
echo "   npm install"
echo ""
echo "3. PRUEBA sin PWA primero:"
echo "   cp .env.emergency .env"
echo "   npm run dev"
echo ""
echo "4. SI FUNCIONA, re-habilita PWA:"
echo "   echo 'VITE_PWA_DISABLED=false' > .env"
echo "   npm run build"
echo "   npm run preview"
echo ""
echo "5. VERIFICA en modo incógnito:"
echo "   - Abre Chrome en modo incógnito"
echo "   - Navega a localhost:4173"
echo "   - Abre DevTools > Console"
echo "   - NO debe mostrar errores de precaching"
echo ""

# 6. Crear script de verificación
cat > verify-pwa-fix.js << 'EOF'
// Script de verificación PWA
console.log('🔍 Verificando configuración PWA...');

// Verificar si hay Service Worker registrado
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Service Workers encontrados:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`   ${index + 1}. Scope: ${reg.scope}`);
      console.log(`      Estado: ${reg.active?.state || 'inactive'}`);
    });
  });
}

// Verificar cache
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('💾 Caches encontrados:', cacheNames.length);
    cacheNames.forEach(name => {
      console.log(`   - ${name}`);
    });
  });
}

console.log('✅ Verificación completa. Revisa los resultados arriba.');
EOF

echo ""
echo "📊 PARA VERIFICAR EL FIX:"
echo "   Pega el contenido de verify-pwa-fix.js en la consola del navegador"
echo ""
echo "🆘 SI PERSISTEN PROBLEMAS:"
echo "   1. Revisa el archivo PWA_EMERGENCY_FIXES.md en tu proyecto"
echo "   2. Considera deshabilitar PWA temporalmente"
echo "   3. Contacta al equipo de desarrollo"
echo ""

# 7. Crear configuración de package.json scripts adicionales
echo "📜 Scripts útiles para package.json:"
echo ""
echo '  "scripts": {'
echo '    "clean:full": "rm -rf dist/ .vite/ node_modules/.vite/ node_modules/.cache/",'
echo '    "clean:pwa": "rm -rf dist/workbox-* dist/sw.js dist/manifest.json",'
echo '    "build:no-pwa": "VITE_PWA_DISABLED=true npm run build",'
echo '    "serve:clean": "npm run clean:full && npm run build && npm run preview"'
echo '  }'
echo ""

echo "🎯 FIX COMPLETADO. Sigue las instrucciones de arriba para resolver el problema." 