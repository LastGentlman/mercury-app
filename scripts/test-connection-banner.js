#!/usr/bin/env node

/**
 * 🧪 Script para probar el ConnectionBanner
 * 
 * Simula diferentes estados de conexión para testing
 */

console.log('🧪 Connection Banner Test Script')
console.log('================================')

// Simular diferentes estados
const states = [
  { name: 'Online', mode: 'online' },
  { name: 'Offline Grace', mode: 'offline_grace' },
  { name: 'Offline Strict', mode: 'offline_strict' },
  { name: 'Sync Pending', mode: 'sync_pending' }
]

console.log('\n📱 Estados disponibles para testing:')
states.forEach((state, index) => {
  console.log(`${index + 1}. ${state.name} (${state.mode})`)
})

console.log('\n🎯 Para probar:')
console.log('1. Abre la app en el navegador')
console.log('2. Ve al panel de demo en la esquina inferior izquierda')
console.log('3. Haz clic en los diferentes estados')
console.log('4. Cambia entre móvil y desktop para ver las diferencias')

console.log('\n📱 En móvil verás:')
console.log('- Indicador compacto en esquina superior derecha')
console.log('- Icono de sincronización (si aplica)')
console.log('- Colores según el estado')

console.log('\n🖥️ En desktop verás:')
console.log('- Banner completo en la parte superior')
console.log('- Texto descriptivo completo')
console.log('- Botón de "Reintentar sincronización"')

console.log('\n✅ El banner ahora es menos invasivo en móvil!') 