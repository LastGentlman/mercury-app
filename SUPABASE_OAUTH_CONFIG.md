# 🔧 Configuración OAuth Supabase para Producción

## Problema Actual
Al hacer login con Google, la aplicación redirige a `localhost:3000` con error:
```
http://localhost:3000/?error=invalid_request&error_code=bad_oauth_state&error_description=OAuth+callback+with+invalid+state
```

## ✅ Solución

### 1. Configurar Site URL
En tu [panel de Supabase](https://app.supabase.com/project/qbnfcugheuawxbdrnyqf/settings/auth):

**Authentication > URL Configuration > Site URL:**
```
https://tu-dominio-de-produccion.com
```

### 2. Configurar Redirect URLs
**Authentication > URL Configuration > Redirect URLs:**

Agregar estas URLs (una por línea):
```
https://tu-dominio-de-produccion.com/auth/callback
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
```

### 3. Variables de Entorno
Asegúrate de que tu `.env` en producción tenga:
```env
VITE_SUPABASE_URL=https://qbnfcugheuawxbdrnyqf.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

### 4. Verificar Configuración OAuth en Google
En Google Cloud Console, verifica que las URLs de redirect autorizadas incluyan:
```
https://qbnfcugheuawxbdrnyqf.supabase.co/auth/v1/callback
```

## 🧪 Probar
1. Guarda los cambios en Supabase
2. Espera 1-2 minutos para que se propague
3. Prueba el login con Google desde tu dominio de producción

## 📝 Notas
- El `bad_oauth_state` indica que Supabase no reconoce el origen de la solicitud
- Asegúrate de que **Site URL** sea exactamente tu dominio de producción
- Las **Redirect URLs** deben incluir tanto producción como desarrollo 