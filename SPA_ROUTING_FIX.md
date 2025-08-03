# 🔧 Solución Error 404 en Rutas SPA

## 🎯 **Problema**
Tu aplicación es una SPA (Single Page Application) con client-side routing. Cuando visitas directamente `https://pedidolist.com/auth/callback`, el servidor busca un archivo físico que no existe.

## ✅ **Solución según tu plataforma:**

### 📦 **Netlify**
Usa el archivo `_redirects` (ya creado):
```
/*    /index.html   200
```
- Este archivo debe estar en la carpeta `public/` o en el root del build

### ▲ **Vercel** 
Usa el archivo `vercel.json` (ya creado):
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 🌐 **Apache** (cPanel, hosting tradicional)
Usa el archivo `.htaccess` (ya creado):
- Debe estar en la carpeta root de tu sitio web

### 🚀 **Nginx** (VPS, servidor propio)
Configura en tu `nginx.conf`:
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### ☁️ **Cloudflare Pages**
En el dashboard de Cloudflare:
- Configuración > Builds & deployments
- Configura `_redirects` como en Netlify

### 🔧 **GitHub Pages**
Crea un archivo `404.html` idéntico a `index.html` en tu build

## 🚀 **Pasos inmediatos:**

1. **Identifica tu plataforma de hosting**
2. **Usa el archivo de configuración correspondiente**
3. **Redeploy/rebuild tu aplicación**
4. **Prueba la ruta**: `https://pedidolist.com/auth/callback`

## 📋 **¿Cuál es tu plataforma?**
- ¿Netlify? → Usa `_redirects`
- ¿Vercel? → Usa `vercel.json` 
- ¿cPanel/Apache? → Usa `.htaccess`
- ¿VPS/Nginx? → Configura nginx
- ¿Otra? → Dime cuál para ayudarte específicamente

## 🧪 **Para probar que funciona:**
1. Ve directamente a: `https://pedidolist.com/dashboard`
2. Debería cargar tu app (no 404)
3. Entonces `https://pedidolist.com/auth/callback` también funcionará 