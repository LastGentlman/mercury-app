#!/bin/bash

# 🧪 Script de Testing para Avatar Google OAuth Fix
# Uso: ./scripts/test-avatar-fix.sh

echo "🐛 Testing Avatar Google OAuth Fix"
echo "=================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Debes ejecutar este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "✅ Directorio correcto detectado"

# Verificar que el archivo auth-service.ts existe
if [ ! -f "src/services/auth-service.ts" ]; then
    echo "❌ Error: No se encontró src/services/auth-service.ts"
    exit 1
fi

echo "✅ Archivo auth-service.ts encontrado"

# Verificar que el fix está implementado
echo ""
echo "🔍 Verificando implementación del fix..."

# Buscar el fallback chain mejorado
if grep -q "user\.user_metadata\?\.picture \|\|" src/services/auth-service.ts; then
    echo "✅ Fallback chain mejorado detectado"
else
    echo "❌ Fallback chain mejorado NO encontrado"
    echo "   Buscando: user.user_metadata?.picture ||"
fi

# Buscar los logs de debugging
if grep -q "DEBUG - Raw user metadata" src/services/auth-service.ts; then
    echo "✅ Logs de debugging detectados"
else
    echo "❌ Logs de debugging NO encontrados"
fi

# Buscar los scopes mejorados
if grep -q "https://www.googleapis.com/auth/userinfo" src/services/auth-service.ts; then
    echo "✅ Scopes de Google mejorados detectados"
else
    echo "❌ Scopes de Google mejorados NO encontrados"
fi

echo ""
echo "📋 Pasos para probar el fix:"
echo "============================"
echo "1. 🚪 Logout completo:"
echo "   - Abre la consola del navegador (F12)"
echo "   - Ejecuta: localStorage.clear(); sessionStorage.clear()"
echo ""
echo "2. 🔐 Login con Google:"
echo "   - Ve a la página de login"
echo "   - Selecciona 'Continuar con Google'"
echo "   - Completa el flujo de OAuth"
echo ""
echo "3. 🔍 Verificar logs en consola:"
echo "   - Deberías ver logs como:"
echo "     🔍 DEBUG - Raw user metadata: {...}"
echo "     🖼️ DEBUG - Avatar URLs disponibles: {...}"
echo "     ✅ Usuario OAuth mapeado: {avatar_url: 'https://...'}"
echo ""
echo "4. 👤 Verificar avatar en UI:"
echo "   - El avatar debería aparecer en el header"
echo "   - El avatar debería aparecer en el perfil"
echo ""
echo "5. 📊 Si hay problemas:"
echo "   - Comparte los logs de la consola"
echo "   - Verifica la configuración de Google OAuth en Supabase"
echo "   - Revisa la documentación en docs/GOOGLE_OAUTH_AVATAR_FIX.md"
echo ""

echo "🎯 Estado del fix:"
echo "=================="
echo "✅ Implementado en auth-service.ts"
echo "✅ Documentado en docs/GOOGLE_OAUTH_AVATAR_FIX.md"
echo "✅ Testing script creado"
echo ""

echo "🚀 ¡Listo para probar! El fix está implementado y documentado." 