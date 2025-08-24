/**
 * 🔧 Script para verificar configuración de Supabase y Google OAuth
 * 
 * Este script ayuda a verificar que la configuración esté correcta
 */

console.log('🔧 Verificando configuración de Supabase y Google OAuth');
console.log('=====================================================');

// Verificar variables de entorno
console.log('\n1️⃣ Variables de Entorno:');
console.log('-------------------------');

const envVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

envVars.forEach(varName => {
  const value = import.meta.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO ENCONTRADA`);
  }
});

// Verificar configuración de Google OAuth
console.log('\n2️⃣ Configuración de Google OAuth:');
console.log('----------------------------------');

console.log('📋 Pasos para verificar en Supabase Dashboard:');
console.log('');
console.log('1. Ve a https://supabase.com/dashboard');
console.log('2. Selecciona tu proyecto');
console.log('3. Ve a Authentication > Providers');
console.log('4. Haz clic en Google');
console.log('5. Verifica que esté habilitado');
console.log('6. Verifica que Client ID y Client Secret estén configurados');
console.log('7. En Scopes, debe tener: openid email profile');
console.log('');

// Verificar configuración de Google Console
console.log('3️⃣ Configuración de Google Console:');
console.log('-----------------------------------');

console.log('📋 Pasos para verificar en Google Cloud Console:');
console.log('');
console.log('1. Ve a https://console.cloud.google.com');
console.log('2. Selecciona tu proyecto');
console.log('3. Ve a APIs & Services > Credentials');
console.log('4. Encuentra tu OAuth 2.0 Client ID');
console.log('5. Verifica que Authorized JavaScript origins incluya:');
console.log('   - https://tu-proyecto.supabase.co');
console.log('   - http://localhost:5173 (para desarrollo)');
console.log('6. Verifica que Authorized redirect URIs incluya:');
console.log('   - https://tu-proyecto.supabase.co/auth/v1/callback');
console.log('');

// Verificar scopes
console.log('4️⃣ Scopes de Google OAuth:');
console.log('----------------------------');

const requiredScopes = [
  'openid',
  'email', 
  'profile'
];

console.log('✅ Scopes requeridos:');
requiredScopes.forEach(scope => {
  console.log(`   - ${scope}`);
});

console.log('');
console.log('⚠️ IMPORTANTE: Los scopes deben estar separados por espacios, no por comas');
console.log('   Ejemplo correcto: "openid email profile"');
console.log('   Ejemplo incorrecto: "openid,email,profile"');
console.log('');

// Checklist de verificación
console.log('5️⃣ Checklist de Verificación:');
console.log('-----------------------------');

const checklist = [
  '✅ Supabase project creado y configurado',
  '✅ Google OAuth provider habilitado en Supabase',
  '✅ Client ID y Client Secret configurados',
  '✅ Scopes configurados correctamente',
  '✅ Redirect URI configurado en Google Console',
  '✅ JavaScript origins configurados en Google Console',
  '✅ Variables de entorno configuradas en el frontend'
];

checklist.forEach(item => {
  console.log(item);
});

console.log('');
console.log('🎯 Próximos Pasos:');
console.log('==================');
console.log('1. Verifica todos los puntos del checklist');
console.log('2. Haz logout completo del navegador');
console.log('3. Haz login de nuevo con Google');
console.log('4. Revisa el debugger en la página de perfil');
console.log('5. Comparte los logs de la consola');
console.log('');
console.log('💡 Si todo está configurado correctamente pero sigue sin funcionar:');
console.log('   - Verifica que el usuario dio permisos durante el login');
console.log('   - Revisa los logs de Supabase en el dashboard');
console.log('   - Verifica que no hay bloqueos de CORS');
console.log('   - Prueba con una cuenta de Google diferente'); 