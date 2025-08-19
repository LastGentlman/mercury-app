#!/bin/bash

echo "🚨 EMERGENCY PWA FIX - PedidoList App"
echo "=================================="

# 1. Limpiar completamente
echo "🧹 Limpiando builds corruptos..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/

# 2. Backup de configuración actual
echo "💾 Creando backup..."
if [ -f "vite.config.ts" ]; then
    cp vite.config.ts vite.config.ts.backup.$(date +%s)
fi

# 3. Crear .env temporal para deshabilitar PWA
echo "🔧 Deshabilitando PWA temporalmente..."
cat > .env.emergency << 'EOF'
VITE_PWA_DISABLED=true
VITE_ENVIRONMENT=development
EOF

# 4. Verificar estructura de archivos
echo "📁 Verificando estructura de archivos..."
if [ ! -f "public/logo192.png" ]; then
    echo "⚠️  ADVERTENCIA: Falta public/logo192.png"
fi

if [ ! -f "public/logo512.png" ]; then
    echo "⚠️  ADVERTENCIA: Falta public/logo512.png"
fi

if [ ! -f "src/styles.css" ]; then
    echo "❌ ERROR: Falta src/styles.css - Este es el problema principal"
    echo "🔧 SOLUCION: Crea el archivo src/styles.css con contenido básico"
fi

echo ""
echo "✅ INSTRUCCIONES DE RECOVERY:"
echo ""
echo "1. VERIFICA que existe src/styles.css:"
echo "   ls -la src/styles.css"
echo ""
echo "2. PRUEBA sin PWA primero:"
echo "   cp .env.emergency .env"
echo "   npm run build"
echo ""
echo "3. SI FUNCIONA, habilita PWA gradualmente:"
echo "   echo 'VITE_PWA_DISABLED=false' > .env"
echo "   npm run build"
echo ""
echo "4. DEPLOY a Vercel:"
echo "   git add ."
echo "   git commit -m 'fix: PWA configuration and CSS issues'"
echo "   git push"
echo ""

# 5. Verificar variables de entorno de Vercel
echo "🌐 VERCEL ENVIRONMENT VARIABLES REQUERIDAS:"
echo ""
echo "   VITE_PWA_DISABLED=false"
echo "   VITE_ENVIRONMENT=production"
echo "   NODE_ENV=production"
echo ""
echo "💡 CONFIGURA ESTAS VARIABLES EN:"
echo "   Vercel Dashboard > Project > Settings > Environment Variables"
echo ""

echo "🎯 RECOVERY COMPLETADO. El dev server debería funcionar ahora." 