// API Connection Test Utility
export async function testAPIConnection() {
  const endpoints = [
    { name: 'Health Check', url: 'http://localhost:3030/health' },
    { name: 'API Root', url: 'http://localhost:3030/' },
    { name: 'Auth Endpoint', url: 'http://localhost:3030/api/auth' }
  ]

  console.log('🔍 Testing API Connection...')
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url)
      const data = await response.json()
      
      console.log(`✅ ${endpoint.name}:`, {
        status: response.status,
        statusText: response.statusText,
        data: data
      })
    } catch (error) {
      console.error(`❌ ${endpoint.name}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        url: endpoint.url
      })
    }
  }
}

// Test registration endpoint
export async function testRegistration() {
  const testUser = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  }

  console.log('🧪 Testing Registration Endpoint...')
  
  try {
    const response = await fetch('http://localhost:3030/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    })

    let data
    try {
      data = await response.json()
    } catch (parseError) {
      // If JSON parsing fails, try to read as text
      const errorText = await response.text()
      console.log('❌ Registration returned plain text instead of JSON:', errorText)
      data = { error: errorText, rawResponse: errorText }
    }
    
    console.log('📝 Registration Test Result:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      data: data
    })

    return { success: response.ok, data }
  } catch (error) {
    console.error('❌ Registration Test Failed:', error)
    return { success: false, error }
  }
}

// Test login endpoint
export async function testLogin() {
  const testCredentials = {
    email: 'test@example.com',
    password: 'testpassword123'
  }

  console.log('🔐 Testing Login Endpoint...')
  
  try {
    const response = await fetch('http://localhost:3030/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials),
    })

    const data = await response.json()
    
    console.log('🔑 Login Test Result:', {
      status: response.status,
      statusText: response.statusText,
      data: data
    })

    return { success: response.ok, data }
  } catch (error) {
    console.error('❌ Login Test Failed:', error)
    return { success: false, error }
  }
}

// Test registration error handling
export async function testRegistrationErrorHandling() {
  console.log('🧪 Testing Registration Error Handling...')
  
  // Test 1: Duplicate email registration
  const testUser1 = {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  }

  try {
    const response1 = await fetch('http://localhost:3030/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser1),
    })

    let data1
    try {
      data1 = await response1.json()
    } catch (parseError) {
      const errorText = await response1.text()
      console.log('❌ First registration returned plain text:', errorText)
      data1 = { error: errorText, rawResponse: errorText }
    }
    
    console.log('📝 First Registration Test Result:', {
      status: response1.status,
      statusText: response1.statusText,
      ok: response1.ok,
      data: data1
    })

    // Test 2: Try to register the same email again (should fail)
    const response2 = await fetch('http://localhost:3030/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser1),
    })

    let data2
    try {
      data2 = await response2.json()
    } catch (parseError) {
      const errorText = await response2.text()
      console.log('❌ Duplicate registration returned plain text:', errorText)
      data2 = { error: errorText, rawResponse: errorText }
    }
    
    console.log('📝 Duplicate Registration Test Result:', {
      status: response2.status,
      statusText: response2.statusText,
      ok: response2.ok,
      data: data2
    })

    return { 
      success: true, 
      firstRegistration: { success: response1.ok, data: data1 },
      duplicateRegistration: { success: response2.ok, data: data2 }
    }
  } catch (error) {
    console.error('❌ Registration Error Handling Test Failed:', error)
    return { success: false, error }
  }
} 