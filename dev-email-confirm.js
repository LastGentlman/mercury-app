/**
 * Script de desarrollo para confirmar automáticamente emails en Supabase
 * Solo usar en desarrollo para facilitar las pruebas
 */

const BACKEND_URL = 'http://localhost:3030';

async function confirmEmail(email) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/confirm-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Email confirmado exitosamente:', data.message);
      return true;
    } else {
      console.error('❌ Error confirmando email:', data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error de red:', error.message);
    return false;
  }
}

// Función para usar desde la consola del navegador
globalThis.confirmEmail = confirmEmail;

// Función para confirmar el último email registrado
globalThis.confirmLastEmail = async () => {
  const email = prompt('Ingresa el email a confirmar:');
  if (email) {
    await confirmEmail(email);
  }
};

console.log('🔧 Script de confirmación de email cargado');
console.log('💡 Usa confirmEmail("tu@email.com") para confirmar un email');
console.log('💡 Usa confirmLastEmail() para confirmar un email con prompt'); 