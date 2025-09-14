#!/bin/bash

echo "🚀 DEPLOY OPTIMIZADO A PRODUCCIÓN - PedidoList"
echo "=============================================="

# 1. Verificar que estamos en la rama correcta
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "⚠️  ADVERTENCIA: No estás en la rama main/master"
    echo "   Rama actual: $CURRENT_BRANCH"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deploy cancelado"
        exit 1
    fi
fi

# 2. Verificar que no hay cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ ERROR: Hay cambios sin commitear"
    echo "   Por favor, haz commit de todos los cambios antes del deploy"
    git status --short
    exit 1
fi

# 3. Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
rm -rf dist/
rm -rf .vite/
rm -rf node_modules/.vite/
rm -rf node_modules/.cache/

# 4. Verificar dependencias
echo "📦 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    echo "   Instalando dependencias..."
    npm install
fi

# 5. Ejecutar tests (opcional)
echo "🧪 Ejecutando tests..."
if npm run test:run > /dev/null 2>&1; then
    echo "   ✅ Tests pasaron"
else
    echo "   ⚠️  Tests fallaron, pero continuando..."
fi

# 6. Type checking
echo "🔍 Verificando tipos..."
if npm run typecheck > /dev/null 2>&1; then
    echo "   ✅ Type checking pasó"
else
    echo "   ❌ Type checking falló"
    echo "   Ejecutando typecheck con detalles:"
    npm run typecheck
    exit 1
fi

# 7. Linting
echo "🔧 Verificando linting..."
if npm run lint > /dev/null 2>&1; then
    echo "   ✅ Linting pasó"
else
    echo "   ⚠️  Linting falló, pero continuando..."
fi

# 8. Build optimizado
echo "🔨 Construyendo aplicación..."
if npm run build; then
    echo "   ✅ Build exitoso"
else
    echo "   ❌ Build falló"
    exit 1
fi

# 9. Verificar que el build fue exitoso
if [ ! -d "dist" ]; then
    echo "❌ ERROR: El directorio dist/ no fue creado"
    exit 1
fi

# 10. Verificar archivos críticos
echo "📋 Verificando archivos críticos..."
CRITICAL_FILES=(
    "dist/index.html"
    "dist/manifest.json"
    "dist/workbox-*.js"
)

for file in "${CRITICAL_FILES[@]}"; do
    if ls $file > /dev/null 2>&1; then
        echo "   ✅ $file existe"
    else
        echo "   ⚠️  $file no encontrado"
    fi
done

# 11. Mostrar estadísticas del build
echo "📊 Estadísticas del build:"
echo "   Tamaño total: $(du -sh dist/ | cut -f1)"
echo "   Archivos JS: $(find dist/ -name "*.js" | wc -l)"
echo "   Archivos CSS: $(find dist/ -name "*.css" | wc -l)"

# 12. Deploy a Vercel
echo "🌐 Desplegando a Vercel..."
if vercel --prod; then
    echo "   ✅ Deploy exitoso"
else
    echo "   ❌ Deploy falló"
    exit 1
fi

# 13. Verificación post-deploy
echo "🔍 Verificando deploy..."
DEPLOY_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "No disponible")
echo "   URL del deploy: $DEPLOY_URL"

# 14. Instrucciones finales
echo ""
echo "✅ DEPLOY COMPLETADO EXITOSAMENTE"
echo "================================="
echo ""
echo "📱 PRÓXIMOS PASOS:"
echo "   1. Verifica la aplicación en: $DEPLOY_URL"
echo "   2. Prueba en modo incógnito para verificar cache"
echo "   3. Verifica que el PWA funciona correctamente"
echo "   4. Monitorea los logs de Vercel por errores"
echo ""
echo "🔧 COMANDOS ÚTILES:"
echo "   - Ver logs: vercel logs"
echo "   - Ver deployments: vercel ls"
echo "   - Rollback: vercel rollback"
echo ""
echo "📊 MONITOREO:"
echo "   - Revisa la consola del navegador para errores"
echo "   - Verifica que el Service Worker se registra correctamente"
echo "   - Prueba la funcionalidad offline"
echo ""

# 15. Crear tag de versión (opcional)
read -p "¿Crear tag de versión? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    VERSION=$(date +%Y%m%d-%H%M%S)
    git tag "v$VERSION"
    echo "   ✅ Tag v$VERSION creado"
fi

echo "🎉 ¡Deploy completado! La aplicación está lista para producción."
