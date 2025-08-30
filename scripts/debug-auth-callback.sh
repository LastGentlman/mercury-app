#!/bin/bash

# 🔍 Debug Script: Auth Callback Hanging Issue
# Diagnostica el problema específico que causa que se cuelgue en /auth/callback

set -e

echo "🔍 Debugging Auth Callback Hanging Issue..."
echo "==========================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
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

log_info "Verificando configuración del proyecto..."

# Verificar variables de entorno
log_info "Verificando variables de entorno..."

ENV_FILE=".env"
if [ -f "$ENV_FILE" ]; then
    log_success "✓ Archivo .env encontrado"
    
    # Verificar variables críticas
    if grep -q "VITE_SUPABASE_URL" "$ENV_FILE"; then
        log_success "✓ VITE_SUPABASE_URL configurado"
    else
        log_warning "⚠️  VITE_SUPABASE_URL no encontrado en .env"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" "$ENV_FILE"; then
        log_success "✓ VITE_SUPABASE_ANON_KEY configurado"
    else
        log_warning "⚠️  VITE_SUPABASE_ANON_KEY no encontrado en .env"
    fi
    
    if grep -q "VITE_BACKEND_URL" "$ENV_FILE"; then
        log_success "✓ VITE_BACKEND_URL configurado"
    else
        log_warning "⚠️  VITE_BACKEND_URL no encontrado en .env"
    fi
else
    log_warning "⚠️  Archivo .env no encontrado"
fi

# Verificar configuración de Supabase
log_info "Verificando configuración de Supabase..."

if [ -f "supabase/config.toml" ]; then
    log_success "✓ Configuración de Supabase encontrada"
    
    # Verificar URL de callback
    if grep -q "redirect_urls" supabase/config.toml; then
        log_success "✓ Redirect URLs configuradas en Supabase"
    else
        log_warning "⚠️  Redirect URLs no encontradas en Supabase config"
    fi
else
    log_warning "⚠️  Configuración de Supabase no encontrada"
fi

# Verificar implementación del callback
log_info "Verificando implementación del callback..."

if [ -f "src/routes/auth.callback.tsx" ]; then
    log_success "✓ Archivo auth.callback.tsx encontrado"
    
    # Verificar componentes clave
    if grep -q "ZeroFlickerAuthCallback" src/routes/auth.callback.tsx; then
        log_success "✓ Componente ZeroFlickerAuthCallback implementado"
    else
        log_error "✗ Componente ZeroFlickerAuthCallback no encontrado"
    fi
    
    if grep -q "onAuthStateChange" src/routes/auth.callback.tsx; then
        log_success "✓ Event-driven approach implementado"
    else
        log_error "✗ onAuthStateChange no encontrado"
    fi
    
    if grep -q "getCurrentUser" src/routes/auth.callback.tsx; then
        log_success "✓ Fallback mechanisms implementados"
    else
        log_error "✗ getCurrentUser no encontrado"
    fi
    
    if grep -q "8000" src/routes/auth.callback.tsx; then
        log_success "✓ Timeout de seguridad implementado"
    else
        log_warning "⚠️  Timeout de seguridad no encontrado"
    fi
else
    log_error "✗ Archivo auth.callback.tsx no encontrado"
    exit 1
fi

# Verificar AuthService
log_info "Verificando AuthService..."

if [ -f "src/services/auth-service.ts" ]; then
    log_success "✓ AuthService encontrado"
    
    if grep -q "onAuthStateChange" src/services/auth-service.ts; then
        log_success "✓ Método onAuthStateChange implementado"
    else
        log_error "✗ Método onAuthStateChange no encontrado"
    fi
    
    if grep -q "getCurrentUser" src/services/auth-service.ts; then
        log_success "✓ Método getCurrentUser implementado"
    else
        log_error "✗ Método getCurrentUser no encontrado"
    fi
else
    log_error "✗ AuthService no encontrado"
    exit 1
fi

# Verificar build
log_info "Verificando build..."

if npm run build > /dev/null 2>&1; then
    log_success "✓ Build successful"
else
    log_error "✗ Build failed"
    log_info "Ejecutando build con errores visibles..."
    npm run build
    exit 1
fi

# Verificar dependencias
log_info "Verificando dependencias..."

if [ -f "package.json" ]; then
    if grep -q "@supabase/supabase-js" package.json; then
        log_success "✓ Supabase client instalado"
    else
        log_warning "⚠️  Supabase client no encontrado en package.json"
    fi
    
    if grep -q "@tanstack/react-router" package.json; then
        log_success "✓ TanStack Router instalado"
    else
        log_warning "⚠️  TanStack Router no encontrado en package.json"
    fi
fi

echo ""
echo "🔍 Análisis del Problema:"
echo "=========================="

# Análisis de posibles causas
echo "1. **URL con hash vacío (#):**"
echo "   - La URL https://pedidolist.com/auth/callback?source=modal# tiene un hash vacío"
echo "   - Esto puede causar problemas con la detección de parámetros OAuth"
echo "   - Solución: Verificar si Supabase está enviando parámetros en el hash"

echo ""
echo "2. **Configuración de Supabase OAuth:**"
echo "   - Verificar que las redirect URLs estén configuradas correctamente"
echo "   - Asegurar que la URL de callback no termine en #"
echo "   - Verificar configuración de proveedores OAuth (Google/Facebook)"

echo ""
echo "3. **Event-driven timing:**"
echo "   - El componente espera eventos de Supabase"
echo "   - Si Supabase no envía eventos, puede quedarse colgado"
echo "   - Timeout de 8 segundos debería activarse"

echo ""
echo "4. **Variables de entorno:**"
echo "   - Verificar que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén configurados"
echo "   - Asegurar que las URLs sean correctas"

echo ""
log_info "📋 Pasos para debugging manual:"

echo "1. **Abrir DevTools en el navegador:**"
echo "   - Ir a https://pedidolist.com/auth/callback?source=modal#"
echo "   - Abrir Console (F12)"
echo "   - Buscar logs con 'AuthCallback' o 'OAuth'"

echo ""
echo "2. **Verificar logs específicos:**"
echo "   - 'Auth callback started with URL:' - Debe aparecer al cargar"
echo "   - 'URL parameters analysis:' - Debe mostrar parámetros"
echo "   - 'No OAuth params detected' - Si no hay parámetros OAuth"
echo "   - 'OAuth parameters detected' - Si hay parámetros OAuth"

echo ""
echo "3. **Verificar estado de Supabase:**"
echo "   - En Console, ejecutar: AuthService.getCurrentUser()"
echo "   - Verificar si retorna usuario o null"
echo "   - Verificar si hay errores de conexión"

echo ""
echo "4. **Verificar configuración OAuth:**"
echo "   - Ir a Supabase Dashboard"
echo "   - Authentication > URL Configuration"
echo "   - Verificar que la URL de callback sea correcta"
echo "   - Asegurar que no termine en #"

echo ""
log_success "🚀 Soluciones recomendadas:"

echo "1. **Solución inmediata:**"
echo "   - Verificar configuración de Supabase OAuth"
echo "   - Asegurar que redirect URLs no terminen en #"
echo "   - Revisar logs en DevTools Console"

echo ""
echo "2. **Solución a largo plazo:**"
echo "   - Implementar mejor manejo de URLs con hash"
echo "   - Agregar más logging para debugging"
echo "   - Implementar fallbacks adicionales"

echo ""
echo "3. **Testing:**"
echo "   - Probar con URL sin hash: /auth/callback?source=modal"
echo "   - Verificar si el problema persiste"
echo "   - Comparar comportamiento"

echo ""
log_info "¡Ejecuta estos pasos para identificar el problema específico! 🔍" 