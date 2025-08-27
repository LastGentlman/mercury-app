// Test script para verificar el requisito "Sin caracteres repetidos consecutivos"

// Función de prueba (la misma que está en el componente)
const testNoRepetition = (password) => !/(.)\1/.test(password)

// Casos de prueba
const testCases = [
  { password: 'abc123', expected: true, description: 'Sin repeticiones' },
  { password: 'aabbcc', expected: false, description: 'Con repeticiones consecutivas' },
  { password: 'aa123', expected: false, description: 'Dos a consecutivas' },
  { password: '123aa', expected: false, description: 'Dos a consecutivas al final' },
  { password: 'a123a', expected: true, description: 'Dos a separadas' },
  { password: 'aaa123', expected: false, description: 'Tres a consecutivas' },
  { password: '123aaa', expected: false, description: 'Tres a consecutivas al final' },
  { password: 'a1a2a3', expected: true, description: 'A separadas por números' },
  { password: 'MySecurePass123!', expected: true, description: 'Contraseña válida' },
  { password: 'Passsword123!', expected: false, description: 'Tres s consecutivas' },
  { password: 'Passwordd123!', expected: false, description: 'Dos d consecutivas' },
  { password: 'MySecurePass123!!', expected: false, description: 'Dos ! consecutivas' },
  { password: 'MySecurePass123!@#', expected: true, description: 'Símbolos diferentes' },
  { password: 'Password123@@', expected: false, description: 'Dos @ consecutivas' },
  { password: 'Password123##', expected: false, description: 'Dos # consecutivas' },
  { password: 'Password123$$', expected: false, description: 'Dos $ consecutivas' },
  { password: 'Password123%%', expected: false, description: 'Dos % consecutivas' },
  { password: 'Password123**', expected: false, description: 'Dos * consecutivas' },
  { password: 'Password123??', expected: false, description: 'Dos ? consecutivas' },
  { password: 'Password123&&', expected: false, description: 'Dos & consecutivas' },
  { password: 'Password12311', expected: false, description: 'Dos 1 consecutivas' },
  { password: 'Password12322', expected: false, description: 'Dos 2 consecutivas' },
  { password: 'Password12333', expected: false, description: 'Dos 3 consecutivas' },
  { password: 'Password12300', expected: false, description: 'Dos 0 consecutivas' },
  { password: 'Password12399', expected: false, description: 'Dos 9 consecutivas' },
  { password: 'Password12355', expected: false, description: 'Dos 5 consecutivas' },
  { password: 'Password12344', expected: false, description: 'Dos 4 consecutivas' },
  { password: 'Password12366', expected: false, description: 'Dos 6 consecutivas' },
  { password: 'Password12377', expected: false, description: 'Dos 7 consecutivas' },
  { password: 'Password12388', expected: false, description: 'Dos 8 consecutivas' },
  { password: 'Password123AA', expected: false, description: 'Dos A consecutivas' },
  { password: 'Password123BB', expected: false, description: 'Dos B consecutivas' },
  { password: 'Password123CC', expected: false, description: 'Dos C consecutivas' },
  { password: 'Password123DD', expected: false, description: 'Dos D consecutivas' },
  { password: 'Password123EE', expected: false, description: 'Dos E consecutivas' },
  { password: 'Password123FF', expected: false, description: 'Dos F consecutivas' },
  { password: 'Password123GG', expected: false, description: 'Dos G consecutivas' },
  { password: 'Password123HH', expected: false, description: 'Dos H consecutivas' },
  { password: 'Password123II', expected: false, description: 'Dos I consecutivas' },
  { password: 'Password123JJ', expected: false, description: 'Dos J consecutivas' },
  { password: 'Password123KK', expected: false, description: 'Dos K consecutivas' },
  { password: 'Password123LL', expected: false, description: 'Dos L consecutivas' },
  { password: 'Password123MM', expected: false, description: 'Dos M consecutivas' },
  { password: 'Password123NN', expected: false, description: 'Dos N consecutivas' },
  { password: 'Password123OO', expected: false, description: 'Dos O consecutivas' },
  { password: 'Password123PP', expected: false, description: 'Dos P consecutivas' },
  { password: 'Password123QQ', expected: false, description: 'Dos Q consecutivas' },
  { password: 'Password123RR', expected: false, description: 'Dos R consecutivas' },
  { password: 'Password123SS', expected: false, description: 'Dos S consecutivas' },
  { password: 'Password123TT', expected: false, description: 'Dos T consecutivas' },
  { password: 'Password123UU', expected: false, description: 'Dos U consecutivas' },
  { password: 'Password123VV', expected: false, description: 'Dos V consecutivas' },
  { password: 'Password123WW', expected: false, description: 'Dos W consecutivas' },
  { password: 'Password123XX', expected: false, description: 'Dos X consecutivas' },
  { password: 'Password123YY', expected: false, description: 'Dos Y consecutivas' },
  { password: 'Password123ZZ', expected: false, description: 'Dos Z consecutivas' },
  { password: 'Password123aa', expected: false, description: 'Dos a consecutivas' },
  { password: 'Password123bb', expected: false, description: 'Dos b consecutivas' },
  { password: 'Password123cc', expected: false, description: 'Dos c consecutivas' },
  { password: 'Password123dd', expected: false, description: 'Dos d consecutivas' },
  { password: 'Password123ee', expected: false, description: 'Dos e consecutivas' },
  { password: 'Password123ff', expected: false, description: 'Dos f consecutivas' },
  { password: 'Password123gg', expected: false, description: 'Dos g consecutivas' },
  { password: 'Password123hh', expected: false, description: 'Dos h consecutivas' },
  { password: 'Password123ii', expected: false, description: 'Dos i consecutivas' },
  { password: 'Password123jj', expected: false, description: 'Dos j consecutivas' },
  { password: 'Password123kk', expected: false, description: 'Dos k consecutivas' },
  { password: 'Password123ll', expected: false, description: 'Dos l consecutivas' },
  { password: 'Password123mm', expected: false, description: 'Dos m consecutivas' },
  { password: 'Password123nn', expected: false, description: 'Dos n consecutivas' },
  { password: 'Password123oo', expected: false, description: 'Dos o consecutivas' },
  { password: 'Password123pp', expected: false, description: 'Dos p consecutivas' },
  { password: 'Password123qq', expected: false, description: 'Dos q consecutivas' },
  { password: 'Password123rr', expected: false, description: 'Dos r consecutivas' },
  { password: 'Password123ss', expected: false, description: 'Dos s consecutivas' },
  { password: 'Password123tt', expected: false, description: 'Dos t consecutivas' },
  { password: 'Password123uu', expected: false, description: 'Dos u consecutivas' },
  { password: 'Password123vv', expected: false, description: 'Dos v consecutivas' },
  { password: 'Password123ww', expected: false, description: 'Dos w consecutivas' },
  { password: 'Password123xx', expected: false, description: 'Dos x consecutivas' },
  { password: 'Password123yy', expected: false, description: 'Dos y consecutivas' },
  { password: 'Password123zz', expected: false, description: 'Dos z consecutivas' }
]

console.log('🧪 Probando requisito: "Sin caracteres repetidos consecutivos"')
console.log('=' .repeat(60))

let passed = 0
let failed = 0

testCases.forEach((testCase, index) => {
  const result = testNoRepetition(testCase.password)
  const status = result === testCase.expected ? '✅' : '❌'
  
  if (result === testCase.expected) {
    passed++
  } else {
    failed++
  }
  
  console.log(`${status} Test ${index + 1}: "${testCase.password}"`)
  console.log(`   Descripción: ${testCase.description}`)
  console.log(`   Esperado: ${testCase.expected}, Obtenido: ${result}`)
  console.log('')
})

console.log('=' .repeat(60))
console.log(`📊 Resultados: ${passed} ✅ pasaron, ${failed} ❌ fallaron`)
console.log(`🎯 Porcentaje de éxito: ${((passed / testCases.length) * 100).toFixed(1)}%`)

if (failed === 0) {
  console.log('🎉 ¡Todos los tests pasaron! El requisito funciona correctamente.')
} else {
  console.log('⚠️ Algunos tests fallaron. Revisa la implementación.')
} 