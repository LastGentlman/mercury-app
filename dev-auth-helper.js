// Script de utilidad para autenticación en desarrollo local
const devAuthHelper = {
  // Generar contraseña válida automáticamente
  generateValidPassword: () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '@$!%*?&';
    
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Agregar caracteres aleatorios para completar 12 caracteres
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar la contraseña
    return password.split('').sort(() => Math.random() - 0.5).join('');
  },

  // Registrar usuario y confirmar email automáticamente
  registerAndConfirmUser: async (email, name = 'Test User') => {
    const password = devAuthHelper.generateValidPassword();
    
    console.log('🔧 Registrando usuario para desarrollo...');
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Contraseña generada: ${password}`);
    
    try {
      // 1. Registrar usuario
      const registerResponse = await fetch('http://localhost:3030/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      
      const registerData = await registerResponse.json();
      
      if (registerResponse.ok) {
        console.log('✅ Usuario registrado correctamente');
        
        // 2. Confirmar email automáticamente
        const confirmResponse = await fetch('http://localhost:3030/api/auth/confirm-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        
        const confirmData = await confirmResponse.json();
        
        if (confirmResponse.ok) {
          console.log('✅ Email confirmado automáticamente');
          
          // 3. Probar login
          const loginResponse = await fetch('http://localhost:3030/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          const loginData = await loginResponse.json();
          
          if (loginResponse.ok) {
            console.log('✅ Login exitoso');
            console.log('🎉 Usuario listo para usar en desarrollo');
            
            return {
              success: true,
              email,
              password,
              message: 'Usuario creado y confirmado exitosamente'
            };
          } else {
            console.log('❌ Error en login después de confirmar:', loginData);
            return { success: false, error: loginData };
          }
        } else {
          console.log('❌ Error confirmando email:', confirmData);
          return { success: false, error: confirmData };
        }
      } else {
        console.log('❌ Error en registro:', registerData);
        return { success: false, error: registerData };
      }
    } catch (error) {
      console.error('❌ Error inesperado:', error.message);
      return { success: false, error: error.message };
    }
  }
};

// Función principal
const main = async () => {
  console.log('🛠️ Herramienta de autenticación para desarrollo local\n');
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'create':
      const email = args[1] || 'test@example.com';
      const name = args[2] || 'Test User';
      await devAuthHelper.registerAndConfirmUser(email, name);
      break;
      
    case 'password':
      const newPassword = devAuthHelper.generateValidPassword();
      console.log('🔑 Contraseña válida generada:', newPassword);
      console.log('📋 Requisitos cumplidos: minúscula, mayúscula, número, símbolo especial');
      break;
      
    default:
      console.log('📖 Uso:');
      console.log('  node dev-auth-helper.js create [email] [name]  - Crear usuario para desarrollo');
      console.log('  node dev-auth-helper.js password               - Generar contraseña válida');
      console.log('');
      console.log('💡 Ejemplos:');
      console.log('  node dev-auth-helper.js create test@example.com "Test User"');
      console.log('  node dev-auth-helper.js password');
      console.log('');
      console.log('🔍 Problemas identificados en local:');
      console.log('  1. Las contraseñas deben cumplir requisitos estrictos');
      console.log('  2. Los emails no se confirman automáticamente en desarrollo');
      console.log('  3. Usa este script para crear usuarios válidos para testing');
      break;
  }
};

// Ejecutar la función principal
main().catch(console.error); 