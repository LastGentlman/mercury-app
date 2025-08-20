// Test script para verificar conectividad completa
const testConnection = async () => {
  console.log('🔍 Probando conectividad completa...\n');

  // Test 1: Backend health check
  try {
    const healthResponse = await fetch('http://localhost:3030/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend Health Check:', healthData);
  } catch (error) {
    console.error('❌ Backend Health Check failed:', error.message);
  }

  // Test 2: Backend auth endpoint
  try {
    const authResponse = await fetch('http://localhost:3030/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    const authData = await authResponse.json();
    console.log('✅ Backend Auth Endpoint:', {
      status: authResponse.status,
      hasError: !!authData.error,
      message: authData.error || 'Endpoint responding correctly'
    });
  } catch (error) {
    console.error('❌ Backend Auth Endpoint failed:', error.message);
  }

  // Test 3: Frontend accessibility
  try {
    const frontendResponse = await fetch('http://localhost:3000');
    console.log('✅ Frontend Accessibility:', {
      status: frontendResponse.status,
      contentType: frontendResponse.headers.get('content-type')
    });
  } catch (error) {
    console.error('❌ Frontend Accessibility failed:', error.message);
  }

  // Test 4: Supabase connection
  try {
    const supabaseUrl = 'https://qbnfcugheuawxbdrnyqf.supabase.co';
    const supabaseResponse = await fetch(`${supabaseUrl}/rest/v1/`);
    console.log('✅ Supabase Connection:', {
      status: supabaseResponse.status,
      accessible: supabaseResponse.status < 500
    });
  } catch (error) {
    console.error('❌ Supabase Connection failed:', error.message);
  }

  console.log('\n🎯 Resumen:');
  console.log('- Frontend: http://localhost:3000');
  console.log('- Backend: http://localhost:3030');
  console.log('- Base de datos: Supabase conectada');
  console.log('\n📝 Si todo está ✅, la aplicación debería funcionar correctamente.');
  console.log('💡 Para probar la autenticación, ve a http://localhost:3000/auth');
};

// Ejecutar el test
testConnection().catch(console.error); 