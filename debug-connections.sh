#!/bin/bash

echo "🔍 Diagnóstico de conexiones - PedidoList"
echo "=========================================="

# Verificar variables de entorno del frontend
echo ""
echo "📋 Variables de entorno del Frontend:"
echo "-------------------------------------"
if [ -f .env ]; then
    echo "✅ .env encontrado"
    echo "VITE_BACKEND_URL: $(grep VITE_BACKEND_URL .env | cut -d'=' -f2)"
    echo "VITE_SUPABASE_URL: $(grep VITE_SUPABASE_URL .env | cut -d'=' -f2 | head -c 50)..."
    echo "VITE_SUPABASE_ANON_KEY: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d'=' -f2 | head -c 20)..."
else
    echo "❌ .env no encontrado"
fi

# Verificar backend
echo ""
echo "🔧 Estado del Backend:"
echo "---------------------"
if curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "✅ Backend ejecutándose en http://localhost:3030"
    BACKEND_RESPONSE=$(curl -s http://localhost:3030/health)
    echo "📊 Respuesta del backend:"
    echo "$BACKEND_RESPONSE" | jq . 2>/dev/null || echo "$BACKEND_RESPONSE"
else
    echo "❌ Backend no está ejecutándose en http://localhost:3030"
    echo "💡 Para iniciar el backend: cd ../Backend && deno run --allow-net --allow-env --allow-read main.ts"
fi

# Verificar frontend
echo ""
echo "🌐 Estado del Frontend:"
echo "----------------------"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend ejecutándose en http://localhost:3000"
else
    echo "❌ Frontend no está ejecutándose en http://localhost:3000"
    echo "💡 Para iniciar el frontend: npm run dev"
fi

# Verificar conexión a Supabase
echo ""
echo "🗄️ Conexión a Supabase:"
echo "----------------------"
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d'=' -f2 2>/dev/null)
if [ -n "$SUPABASE_URL" ]; then
    echo "✅ URL de Supabase configurada: $SUPABASE_URL"
    if curl -s "$SUPABASE_URL/rest/v1/" > /dev/null 2>&1; then
        echo "✅ Conexión a Supabase exitosa"
    else
        echo "❌ No se puede conectar a Supabase"
    fi
else
    echo "❌ URL de Supabase no configurada"
fi

# Verificar variables de entorno del backend
echo ""
echo "🔧 Variables de entorno del Backend:"
echo "-----------------------------------"
if [ -f ../Backend/.env.local ]; then
    echo "✅ .env.local encontrado"
    echo "BACKEND_URL: $(grep BACKEND_URL ../Backend/.env.local | cut -d'=' -f2)"
    echo "PORT: $(grep PORT ../Backend/.env.local | cut -d'=' -f2)"
else
    echo "❌ .env.local no encontrado en el backend"
fi

# Verificar Redis (opcional)
echo ""
echo "🔴 Estado de Redis:"
echo "------------------"
if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        echo "✅ Redis ejecutándose"
    else
        echo "❌ Redis no está ejecutándose"
    fi
else
    echo "ℹ️ Redis CLI no instalado (opcional)"
fi

echo ""
echo "🎯 Resumen de problemas:"
echo "======================="

# Detectar problemas
PROBLEMS=0

if ! curl -s http://localhost:3030/health > /dev/null 2>&1; then
    echo "❌ Backend no ejecutándose"
    PROBLEMS=$((PROBLEMS + 1))
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Frontend no ejecutándose"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ ! -f .env ]; then
    echo "❌ Archivo .env del frontend faltante"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ ! -f ../Backend/.env.local ]; then
    echo "❌ Archivo .env.local del backend faltante"
    PROBLEMS=$((PROBLEMS + 1))
fi

if [ $PROBLEMS -eq 0 ]; then
    echo "✅ Todo parece estar funcionando correctamente"
else
    echo ""
    echo "🔧 Soluciones recomendadas:"
    echo "1. Iniciar backend: cd ../Backend && deno run --allow-net --allow-env --allow-read main.ts"
    echo "2. Iniciar frontend: npm run dev"
    echo "3. Verificar archivos .env"
fi

echo ""
echo "📝 Para más información, revisa los logs del navegador (F12 -> Console)" 