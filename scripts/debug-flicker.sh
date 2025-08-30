#!/bin/bash

# 🔍 Debug Script: OAuth Flicker Diagnosis
# Identifica exactamente qué está causando el parpadeo

set -e

echo "🔍 Diagnóstico de Parpadeo OAuth..."
echo "===================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    log_error "No se encontró package.json. Ejecuta este script desde el directorio mercury-app/"
    exit 1
fi

echo ""
log_info "🔍 PASO 1: Verificando implementación actual..."

# Verificar si el componente ZeroFlickerAuthCallback está siendo usado
if grep -q "ZeroFlickerAuthCallback" src/routes/auth.callback.tsx; then
    log_success "✓ Componente ZeroFlickerAuthCallback encontrado"
else
    log_error "✗ Componente ZeroFlickerAuthCallback NO encontrado"
    log_info "Esto podría ser la causa del parpadeo"
fi

# Verificar si onAuthStateChange está siendo usado
if grep -q "onAuthStateChange" src/routes/auth.callback.tsx; then
    log_success "✓ onAuthStateChange implementado"
else
    log_error "✗ onAuthStateChange NO encontrado"
    log_info "Esto es CRÍTICO - sin event-driven approach habrá parpadeo"
fi

echo ""
log_info "🔍 PASO 2: Verificando posibles causas del parpadeo..."

# Verificar si hay polling o delays visibles
if grep -q "setTimeout.*500" src/routes/auth.callback.tsx; then
    log_warning "⚠️  Delay de 500ms encontrado - esto causa parpadeo visible"
fi

if grep -q "setTimeout.*800" src/routes/auth.callback.tsx; then
    log_warning "⚠️  Delay de 800ms encontrado - esto causa parpadeo visible"
fi

# Verificar si hay múltiples verificaciones de sesión
SESSION_CHECKS=$(grep -c "getCurrentUser" src/routes/auth.callback.tsx || echo "0")
if [ "$SESSION_CHECKS" -gt 3 ]; then
    log_warning "⚠️  Múltiples verificaciones de sesión ($SESSION_CHECKS) - puede causar parpadeo"
fi

# Verificar si hay re-renders innecesarios en useAuth
if grep -q "refetch.*auth-user" src/hooks/useAuth.ts; then
    log_warning "⚠️  Refetch automático en useAuth - puede causar re-renders"
fi

echo ""
log_info "🔍 PASO 3: Verificando configuración de Supabase..."

# Verificar configuración de Supabase
if grep -q "detectSessionInUrl.*true" src/services/auth-service.ts; then
    log_success "✓ detectSessionInUrl habilitado"
else
    log_warning "⚠️  detectSessionInUrl no encontrado - puede causar problemas"
fi

# Verificar autoRefreshToken
if grep -q "autoRefreshToken.*true" src/services/auth-service.ts; then
    log_success "✓ autoRefreshToken habilitado"
else
    log_warning "⚠️  autoRefreshToken no encontrado"
fi

echo ""
log_info "🔍 PASO 4: Verificando posibles conflictos..."

# Verificar si hay múltiples listeners de auth state
AUTH_LISTENERS=$(grep -c "onAuthStateChange" src/hooks/useAuth.ts || echo "0")
if [ "$AUTH_LISTENERS" -gt 0 ]; then
    log_warning "⚠️  Listener de auth state en useAuth ($AUTH_LISTENERS) - puede causar conflictos"
fi

# Verificar si hay múltiples componentes que usan useAuth
AUTH_USERS=$(grep -r "useAuth" src/components/ --include="*.tsx" | wc -l)
if [ "$AUTH_USERS" -gt 5 ]; then
    log_warning "⚠️  Muchos componentes usando useAuth ($AUTH_USERS) - puede causar re-renders"
fi

echo ""
log_info "🔍 PASO 5: Análisis de timing..."

# Mostrar el flujo actual detectado
echo "📊 Flujo de autenticación detectado:"
echo "-----------------------------------"

if grep -q "hasOAuthParams" src/routes/auth.callback.tsx; then
    echo "1. ✅ Detección de parámetros OAuth"
else
    echo "1. ❌ No se detecta verificación de parámetros OAuth"
fi

if grep -q "onAuthStateChange" src/routes/auth.callback.tsx; then
    echo "2. ✅ Event-driven listener configurado"
else
    echo "2. ❌ NO hay event-driven listener"
fi

if grep -q "SIGNED_IN" src/routes/auth.callback.tsx; then
    echo "3. ✅ Manejo de evento SIGNED_IN"
else
    echo "3. ❌ NO se maneja evento SIGNED_IN"
fi

if grep -q "handleSuccess" src/routes/auth.callback.tsx; then
    echo "4. ✅ Función handleSuccess implementada"
else
    echo "4. ❌ NO hay función handleSuccess"
fi

echo ""
log_info "🔍 PASO 6: Recomendaciones..."

echo ""
echo "🎯 DIAGNÓSTICO FINAL:"
echo "===================="

# Determinar la causa más probable
if ! grep -q "onAuthStateChange" src/routes/auth.callback.tsx; then
    log_error "🚨 CAUSA PRINCIPAL: No hay event-driven approach"
    echo "   - El componente no está usando onAuthStateChange"
    echo "   - Se está usando polling o delays visibles"
    echo "   - SOLUCIÓN: Implementar ZeroFlickerAuthCallback"
elif grep -q "setTimeout.*[0-9][0-9][0-9]" src/routes/auth.callback.tsx; then
    log_warning "🚨 CAUSA PROBABLE: Delays visibles detectados"
    echo "   - Hay setTimeout con delays de 500ms o más"
    echo "   - Estos delays son visibles para el usuario"
    echo "   - SOLUCIÓN: Eliminar delays o hacerlos invisibles"
elif [ "$AUTH_LISTENERS" -gt 1 ]; then
    log_warning "🚨 CAUSA PROBABLE: Múltiples listeners de auth"
    echo "   - Hay $AUTH_LISTENERS listeners de auth state"
    echo "   - Pueden causar conflictos y re-renders"
    echo "   - SOLUCIÓN: Consolidar listeners"
else
    log_success "✅ Implementación parece correcta"
    echo "   - Event-driven approach implementado"
    echo "   - No hay delays visibles detectados"
    echo "   - El parpadeo puede ser por otra causa"
fi

echo ""
echo "🔧 ACCIONES RECOMENDADAS:"
echo "========================"

echo "1. Verificar en DevTools:"
echo "   - Abrir Console"
echo "   - Buscar logs con 'AuthCallback'"
echo "   - Verificar timing de eventos"

echo ""
echo "2. Testing manual:"
echo "   - npm run dev"
echo "   - Probar OAuth flow"
echo "   - Observar timing exacto"

echo ""
echo "3. Debugging avanzado:"
echo "   - Agregar console.time() en auth callback"
echo "   - Verificar si onAuthStateChange se dispara"
echo "   - Confirmar timing de navegación"

echo ""
log_info "¡Diagnóstico completado! Revisa las recomendaciones arriba." 