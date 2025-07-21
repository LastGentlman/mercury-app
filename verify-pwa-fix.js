// Script de verificación PWA
console.log('🔍 Verificando configuración PWA...');

// Verificar si hay Service Worker registrado
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('📋 Service Workers encontrados:', registrations.length);
    registrations.forEach((reg, index) => {
      console.log(`   ${index + 1}. Scope: ${reg.scope}`);
      console.log(`      Estado: ${reg.active?.state || 'inactive'}`);
    });
  });
}

// Verificar cache
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('💾 Caches encontrados:', cacheNames.length);
    cacheNames.forEach(name => {
      console.log(`   - ${name}`);
    });
  });
}

console.log('✅ Verificación completa. Revisa los resultados arriba.'); 