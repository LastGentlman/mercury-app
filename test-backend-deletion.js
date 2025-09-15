/**
 * Test script to verify backend account deletion
 * Run this to test if the backend is properly handling account deletion
 */

const BACKEND_URL = 'http://localhost:3030'; // Adjust if different

async function testAccountDeletion() {
  console.log('🧪 Testing backend account deletion...');
  
  // You'll need to replace this with a valid auth token
  const authToken = 'YOUR_AUTH_TOKEN_HERE';
  
  if (authToken === 'YOUR_AUTH_TOKEN_HERE') {
    console.log('❌ Please replace YOUR_AUTH_TOKEN_HERE with a valid token');
    console.log('   Get it from localStorage.getItem("authToken") in browser console');
    return;
  }
  
  try {
    // Test 1: Verify user exists before deletion
    console.log('🔍 Step 1: Verifying user exists...');
    const meResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ User exists:', userData.email);
    } else {
      console.log('❌ User verification failed:', meResponse.status);
      return;
    }
    
    // Test 2: Attempt account deletion
    console.log('🗑️ Step 2: Attempting account deletion...');
    const deleteResponse = await fetch(`${BACKEND_URL}/api/auth/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Account deletion successful:', deleteData.message);
    } else {
      const errorData = await deleteResponse.json();
      console.log('❌ Account deletion failed:', errorData.error);
      console.log('   Code:', errorData.code);
      return;
    }
    
    // Test 3: Verify user is deleted
    console.log('🔍 Step 3: Verifying user is deleted...');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for deletion
    
    const verifyResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.status === 401 || verifyResponse.status === 403) {
      console.log('✅ User successfully deleted (401/403 response)');
    } else if (verifyResponse.ok) {
      console.log('❌ User still exists after deletion');
    } else {
      console.log('✅ User deletion verified (non-200 response)');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAccountDeletion();
