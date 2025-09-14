# 🧪 Test de Eliminación de Cuenta

## Pasos para Probar la Eliminación de Cuenta

### 1. Preparación
```bash
# Limpiar build anterior
rm -rf dist/
npm run build

# O usar el script de limpieza
./cleanup-pwa.sh
```

### 2. Limpiar Navegador
1. Abrir DevTools (F12)
2. Ir a la pestaña **Application**
3. En **Storage**:
   - Clear Storage > Clear site data
   - Service Workers > Unregister all
   - Local Storage > Clear all
   - Session Storage > Clear all
   - IndexedDB > Delete all databases
4. Hard refresh (Ctrl+Shift+R)

### 3. Probar Eliminación de Cuenta
1. **Iniciar sesión** con una cuenta de prueba
2. **Verificar autenticación**:
   - Debería redirigir a dashboard
   - Consola debería mostrar: `✅ Usuario autenticado`
3. **Ir a Configuración**:
   - Click en avatar > Configuración
   - Scroll hasta "Eliminar cuenta"
4. **Iniciar eliminación**:
   - Click en "Eliminar cuenta permanentemente"
   - Escribir "ELIMINAR" en el campo de confirmación
   - Click en "Eliminar cuenta permanentemente"
5. **Confirmar eliminación**:
   - SweetAlert2 debería aparecer
   - Click en "Sí, eliminar cuenta"

### 4. Verificar Resultado Esperado

#### ✅ **Comportamiento Correcto:**
```
🧹 Starting complete authentication cleanup...
🔍 Verifying account deletion...
⏳ Waiting for backend deletion to complete...
✅ Supabase session error (expected after deletion): [error message]
✅ Account deletion verification completed
🧹 Starting Service Worker cleanup...
🗑️ Unregistering service worker: [scope]
✅ All service workers unregistered
✅ Complete cleanup finished
```

#### ❌ **Comportamiento Incorrecto (problema actual):**
```
🔄 Auth state cambió: INITIAL_SESSION {hasSession: true, userEmail: '...'}
🔍 Supabase session result: {hasSession: true, hasUser: true, ...}
✅ Usuario autenticado, redirigiendo inmediatamente...
```

### 5. Verificaciones Post-Eliminación

1. **Redirección**: Debería ir a `/auth`
2. **Consola limpia**: Sin errores de Service Worker
3. **Sin sesión persistente**: No debería mostrar usuario autenticado
4. **Storage limpio**: localStorage y sessionStorage vacíos

### 6. Si el Problema Persiste

#### Opción A: Deshabilitar PWA temporalmente
```bash
# En .env
VITE_PWA_DISABLED=true
npm run build
```

#### Opción B: Usar modo incógnito
- Abrir ventana incógnita/privada
- Probar eliminación de cuenta

#### Opción C: Verificar backend
```bash
# Verificar logs del backend
cd ../Backend
deno run --allow-all main.ts
```

### 7. Logs a Monitorear

#### Frontend (Consola del navegador):
- `🧹 Starting complete authentication cleanup...`
- `🔍 Verifying account deletion...`
- `✅ Supabase session error (expected after deletion)`
- `✅ Account deletion verification completed`

#### Backend (Terminal):
- `✅ Account successfully deleted for user: [email] ([id])`
- `🗑️ STEP 5: Delete user from Supabase Auth`

### 8. Troubleshooting

#### Si la sesión persiste:
1. Verificar que el backend realmente eliminó la cuenta
2. Comprobar que `supabase.auth.admin.deleteUser()` se ejecutó
3. Verificar que no hay múltiples Service Workers activos

#### Si hay errores de workbox:
1. Limpiar todos los caches del navegador
2. Desregistrar todos los Service Workers
3. Reconstruir el proyecto con `npm run build`

## 🎯 Resultado Final Esperado

Después de la eliminación exitosa:
- ✅ Usuario redirigido a `/auth`
- ✅ Sin sesión persistente
- ✅ Sin errores en consola
- ✅ Storage completamente limpio
- ✅ Service Workers desregistrados
