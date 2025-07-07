import { BACKEND_URL } from '../config';

// API Connection Test Utility
export async function testAPIConnection() {
  const endpoints = [
    { name: 'Health Check', url: `${BACKEND_URL}/health` },
    { name: 'API Root', url: `${BACKEND_URL}/` }
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
    email: 'testuser123@gmail.com',
    password: 'testpassword123',
    name: 'Test User'
  }

  console.log('🧪 Testing Registration Endpoint...')
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    })

    let data
    // Clone the response to avoid "body stream already read" error
    const responseClone = response.clone()
    
    try {
      data = await response.json()
    } catch (parseError) {
      // If JSON parsing fails, try to read as text from the cloned response
      try {
        const errorText = await responseClone.text()
        console.log('❌ Registration returned plain text instead of JSON:', errorText)
        data = { error: errorText, rawResponse: errorText }
      } catch (textError) {
        console.log('❌ Could not read response body:', textError)
        data = { error: 'Could not read response body', rawResponse: null }
      }
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
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Test login endpoint
export async function testLogin() {
  const testCredentials = {
    email: 'testuser123@gmail.com',
    password: 'testpassword123'
  }

  console.log('🔐 Testing Login Endpoint...')
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
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
    email: 'testuser456@gmail.com',
    password: 'testpassword123',
    name: 'Test User'
  }

  try {
    const response1 = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser1),
    })

    let data1
    // Clone the response to avoid "body stream already read" error
    const response1Clone = response1.clone()
    
    try {
      data1 = await response1.json()
    } catch (parseError) {
      const errorText = await response1Clone.text()
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
    const response2 = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser1),
    })

    let data2
    // Clone the response to avoid "body stream already read" error
    const response2Clone = response2.clone()
    
    try {
      data2 = await response2.json()
    } catch (parseError) {
      const errorText = await response2Clone.text()
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