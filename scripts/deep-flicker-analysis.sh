#!/bin/bash

# 🔍 Deep Flicker Analysis Script
# Análisis profundo para identificar TODAS las posibles causas del parpadeo

set -e

echo "🔍 Deep Flicker Analysis..."
echo "==========================="

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
log_info "🔍 PASO 1: Análisis de Componentes que Causan Re-renders..."

# Buscar todos los componentes que usan useAuth
echo "📊 Componentes usando useAuth:"
grep -r "useAuth" src/components/ --include="*.tsx" | cut -d: -f1 | sort | uniq -c | sort -nr

echo ""
log_info "🔍 PASO 2: Análisis de Auth Callback..."

# Verificar si hay delays visibles
if grep -q "setTimeout.*[0-9][0-9][0-9]" src/routes/auth.callback.tsx; then
    log_warning "⚠️  Delays detectados en auth callback:"
    grep -n "setTimeout.*[0-9][0-9][0-9]" src/routes/auth.callback.tsx
else
    log_success "✅ No hay delays visibles detectados"
fi

# Verificar si hay múltiples verificaciones de sesión
SESSION_CHECKS=$(grep -c "getCurrentUser" src/routes/auth.callback.tsx || echo "0")
echo "📊 Verificaciones de sesión en auth callback: $SESSION_CHECKS"

echo ""
log_info "🔍 PASO 3: Análisis de useAuth Hook..."

# Verificar si hay polling o intervalos
if grep -q "setInterval\|setTimeout.*[0-9]" src/hooks/useAuth.ts; then
    log_warning "⚠️  Polling o timeouts detectados en useAuth:"
    grep -n "setInterval\|setTimeout.*[0-9]" src/hooks/useAuth.ts
else
    log_success "✅ No hay polling detectado en useAuth"
fi

# Verificar configuración de queries
if grep -q "refetchInterval\|refetchOnWindowFocus" src/hooks/useAuth.ts; then
    log_warning "⚠️  Auto-refetch configurado en useAuth"
else
    log_success "✅ No hay auto-refetch configurado"
fi

echo ""
log_info "🔍 PASO 4: Análisis de TanStack Query..."

# Verificar configuración de TanStack Query
if [ -f "src/integrations/tanstack-query/layout.tsx" ]; then
    echo "📊 Configuración de TanStack Query:"
    if grep -q "refetchOnWindowFocus.*true" src/integrations/tanstack-query/layout.tsx; then
        log_warning "⚠️  refetchOnWindowFocus habilitado"
    fi
    if grep -q "refetchOnMount.*true" src/integrations/tanstack-query/layout.tsx; then
        log_warning "⚠️  refetchOnMount habilitado"
    fi
    if grep -q "refetchOnReconnect.*true" src/integrations/tanstack-query/layout.tsx; then
        log_warning "⚠️  refetchOnReconnect habilitado"
    fi
else
    log_warning "⚠️  No se encontró configuración de TanStack Query"
fi

echo ""
log_info "🔍 PASO 5: Análisis de Supabase Config..."

# Verificar configuración de Supabase
if grep -q "autoRefreshToken.*true" src/services/auth-service.ts; then
    log_success "✅ autoRefreshToken habilitado"
else
    log_warning "⚠️  autoRefreshToken no configurado"
fi

if grep -q "detectSessionInUrl.*true" src/services/auth-service.ts; then
    log_success "✅ detectSessionInUrl habilitado"
else
    log_warning "⚠️  detectSessionInUrl no configurado"
fi

echo ""
log_info "🔍 PASO 6: Análisis de React Strict Mode..."

# Verificar si React Strict Mode está habilitado
if grep -q "StrictMode" src/main.tsx; then
    log_warning "⚠️  React Strict Mode detectado - puede causar doble renderizado"
else
    log_success "✅ React Strict Mode no detectado"
fi

echo ""
log_info "🔍 PASO 7: Análisis de CSS Transitions..."

# Verificar si hay transiciones CSS que puedan causar parpadeo
if grep -r "transition.*[0-9]" src/ --include="*.css" --include="*.tsx" | head -5; then
    log_warning "⚠️  Transiciones CSS detectadas que pueden causar parpadeo"
else
    log_success "✅ No se detectaron transiciones CSS problemáticas"
fi

echo ""
log_info "🔍 PASO 8: Análisis de Loading States..."

# Verificar si hay múltiples loading states
LOADING_STATES=$(grep -r "isLoading\|loading" src/components/ --include="*.tsx" | wc -l)
echo "📊 Estados de loading detectados: $LOADING_STATES"

echo ""
log_info "🔍 PASO 9: Análisis de Route Changes..."

# Verificar si hay problemas con el router
if grep -q "useNavigate\|navigate" src/routes/auth.callback.tsx; then
    log_success "✅ Navegación implementada en auth callback"
else
    log_warning "⚠️  Navegación no detectada en auth callback"
fi

echo ""
log_info "🔍 PASO 10: Análisis de Memory Leaks..."

# Verificar si hay cleanup functions
if grep -q "cleanup\|unsubscribe" src/routes/auth.callback.tsx; then
    log_success "✅ Cleanup functions implementadas"
else
    log_warning "⚠️  Cleanup functions no detectadas"
fi

echo ""
echo "🎯 DIAGNÓSTICO FINAL:"
echo "===================="

# Determinar las causas más probables
CAUSES=()

if [ "$SESSION_CHECKS" -gt 3 ]; then
    CAUSES+=("Múltiples verificaciones de sesión ($SESSION_CHECKS)")
fi

if grep -q "setTimeout.*[0-9][0-9][0-9]" src/routes/auth.callback.tsx; then
    CAUSES+=("Delays visibles en auth callback")
fi

if grep -q "StrictMode" src/main.tsx; then
    CAUSES+=("React Strict Mode causando doble renderizado")
fi

if [ "$LOADING_STATES" -gt 10 ]; then
    CAUSES+=("Muchos estados de loading ($LOADING_STATES)")
fi

if [ ${#CAUSES[@]} -eq 0 ]; then
    log_success "✅ No se detectaron causas obvias del parpadeo"
    echo "   - El problema puede ser más sutil"
    echo "   - Revisar DevTools Performance tab"
    echo "   - Verificar timing de eventos OAuth"
else
    log_warning "🚨 Posibles causas del parpadeo:"
    for cause in "${CAUSES[@]}"; do
        echo "   - $cause"
    done
fi

echo ""
echo "🔧 ACCIONES RECOMENDADAS:"
echo "========================"

echo "1. Debugging en DevTools:"
echo "   - Abrir Performance tab"
echo "   - Grabar durante OAuth flow"
echo "   - Buscar re-renders innecesarios"

echo ""
echo "2. Verificar timing exacto:"
echo "   - Agregar console.time() en auth callback"
echo "   - Medir tiempo entre eventos"
echo "   - Identificar delays específicos"

echo ""
echo "3. Testing específico:"
echo "   - Probar en modo incógnito"
echo "   - Verificar en diferentes navegadores"
echo "   - Comprobar en dispositivos móviles"

echo ""
log_info "¡Análisis profundo completado!" 