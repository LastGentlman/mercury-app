#!/bin/bash

echo "🔍 VERIFICACIÓN POST-DEPLOY - PedidoList"
echo "========================================"

# Obtener URL del deploy
DEPLOY_URL=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null)

if [ "$DEPLOY_URL" = "null" ] || [ -z "$DEPLOY_URL" ]; then
    echo "❌ No se pudo obtener la URL del deploy"
    echo "   Asegúrate de que el deploy fue exitoso"
    exit 1
fi

echo "🌐 URL del deploy: $DEPLOY_URL"
echo ""

# 1. Verificar que la página principal carga
echo "📄 Verificando página principal..."
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL" | grep -q "200"; then
    echo "   ✅ Página principal carga correctamente"
else
    echo "   ❌ Error al cargar página principal"
fi

# 2. Verificar manifest.json
echo "📱 Verificando manifest.json..."
if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/manifest.json" | grep -q "200"; then
    echo "   ✅ Manifest.json accesible"
else
    echo "   ❌ Error al acceder manifest.json"
fi

# 3. Verificar service worker
echo "⚙️  Verificando service worker..."
SW_URL=$(curl -s "$DEPLOY_URL" | grep -o 'workbox-[^"]*\.js' | head -1)
if [ -n "$SW_URL" ]; then
    if curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL/$SW_URL" | grep -q "200"; then
        echo "   ✅ Service Worker accesible: $SW_URL"
    else
        echo "   ❌ Error al acceder Service Worker"
    fi
else
    echo "   ⚠️  No se encontró Service Worker en el HTML"
fi

# 4. Verificar headers de cache
echo "🗄️  Verificando headers de cache..."
INDEX_HEADERS=$(curl -s -I "$DEPLOY_URL" | grep -i "cache-control")
if echo "$INDEX_HEADERS" | grep -q "no-cache"; then
    echo "   ✅ Headers de cache correctos para index.html"
else
    echo "   ⚠️  Headers de cache no optimizados"
fi

# 5. Verificar assets
echo "📦 Verificando assets..."
ASSETS_COUNT=$(curl -s "$DEPLOY_URL" | grep -o 'assets/[^"]*\.js' | wc -l)
if [ "$ASSETS_COUNT" -gt 0 ]; then
    echo "   ✅ $ASSETS_COUNT archivos JS encontrados"
else
    echo "   ❌ No se encontraron archivos JS"
fi

# 6. Verificar PWA score (básico)
echo "📊 Verificando PWA básico..."
if curl -s "$DEPLOY_URL" | grep -q "manifest.json"; then
    echo "   ✅ Manifest referenciado en HTML"
else
    echo "   ❌ Manifest no referenciado"
fi

if curl -s "$DEPLOY_URL" | grep -q "workbox"; then
    echo "   ✅ Service Worker registrado"
else
    echo "   ❌ Service Worker no registrado"
fi

# 7. Verificar variables de entorno
echo "🔧 Verificando configuración..."
if curl -s "$DEPLOY_URL" | grep -q "pedidolist"; then
    echo "   ✅ Aplicación cargada correctamente"
else
    echo "   ⚠️  Posible problema en la aplicación"
fi

echo ""
echo "📋 RESUMEN DE VERIFICACIÓN"
echo "=========================="
echo "URL: $DEPLOY_URL"
echo "Fecha: $(date)"
echo ""
echo "🔗 ENLACES ÚTILES:"
echo "   - Aplicación: $DEPLOY_URL"
echo "   - Manifest: $DEPLOY_URL/manifest.json"
echo "   - Lighthouse: https://developers.google.com/speed/pagespeed/insights/?url=$DEPLOY_URL"
echo ""
echo "📱 PRUEBAS MANUALES RECOMENDADAS:"
echo "   1. Abrir en modo incógnito"
echo "   2. Verificar que no hay errores en consola"
echo "   3. Probar funcionalidad offline"
echo "   4. Verificar notificaciones de actualización"
echo "   5. Probar en dispositivo móvil"
echo ""
echo "✅ Verificación completada"
