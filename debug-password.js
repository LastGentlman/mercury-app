// Debug script para analizar los casos que fallaron

const testNoRepetition = (password) => !/(.)\1/.test(password)

// Función para encontrar caracteres repetidos consecutivos
const findConsecutiveRepetitions = (password) => {
  const repetitions = []
  for (let i = 0; i < password.length - 1; i++) {
    if (password[i] === password[i + 1]) {
      repetitions.push({
        position: i,
        character: password[i],
        count: 2
      })
    }
  }
  return repetitions
}

// Casos problemáticos
const problemCases = [
  'SecurePass123!',
  'SecurePass123!@#'
]

console.log('🔍 Analizando casos problemáticos...')
console.log('=' .repeat(50))

problemCases.forEach((password, index) => {
  console.log(`\n📝 Caso ${index + 1}: "${password}"`)
  console.log(`   Longitud: ${password.length}`)
  console.log(`   Caracteres: ${password.split('').join(' ')}`)
  console.log(`   Posiciones: ${password.split('').map((_, i) => i.toString().padStart(2)).join(' ')}`)
  
  const repetitions = findConsecutiveRepetitions(password)
  console.log(`   Repeticiones consecutivas encontradas: ${repetitions.length}`)
  
  repetitions.forEach(rep => {
    console.log(`     - Posición ${rep.position}: "${rep.character}" repetido ${rep.count} veces`)
  })
  
  const result = testNoRepetition(password)
  console.log(`   Resultado del test: ${result}`)
  console.log(`   Regex /(.)\\1/ encuentra: ${/(.)\1/.test(password) ? 'SÍ' : 'NO'}`)
  
  // Mostrar qué caracteres coinciden con la regex
  const match = password.match(/(.)\1/)
  if (match) {
    console.log(`   Coincidencia: "${match[0]}" en posición ${match.index}`)
  }
})

console.log('\n' + '=' .repeat(50))
console.log('✅ Análisis completado') 