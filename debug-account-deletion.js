/**
 * Debug script to test account deletion
 * This will help us understand what's happening during the deletion process
 */

const BACKEND_URL = 'http://localhost:3030';

async function debugAccountDeletion() {
  console.log('🔍 Debugging account deletion process...');
  
  // Get auth token from localStorage (you'll need to copy this from browser)
  const authToken = prompt('Enter your auth token from localStorage.getItem("authToken"):');
  
  if (!authToken) {
    console.log('❌ No auth token provided');
    return;
  }
  
  try {
    // Step 1: Check if backend is running
    console.log('🔍 Step 1: Checking backend health...');
    const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
    if (healthResponse.ok) {
      console.log('✅ Backend is running');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }
    
    // Step 2: Verify user exists
    console.log('🔍 Step 2: Verifying user exists...');
    const meResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (meResponse.ok) {
      const userData = await meResponse.json();
      console.log('✅ User exists:', userData.email, userData.id);
    } else {
      console.log('❌ User verification failed:', meResponse.status);
      return;
    }
    
    // Step 3: Attempt deletion
    console.log('🗑️ Step 3: Attempting account deletion...');
    const deleteResponse = await fetch(`${BACKEND_URL}/api/auth/account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Delete response status:', deleteResponse.status);
    
    if (deleteResponse.ok) {
      const deleteData = await deleteResponse.json();
      console.log('✅ Account deletion successful:', deleteData.message);
    } else {
      const errorData = await deleteResponse.json();
      console.log('❌ Account deletion failed:', errorData.error);
      console.log('   Code:', errorData.code);
      if (errorData.details) {
        console.log('   Details:', errorData.details);
      }
      return;
    }
    
    // Step 4: Wait and verify deletion
    console.log('⏳ Step 4: Waiting for deletion to complete...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const verifyResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Verify response status:', verifyResponse.status);
    
    if (verifyResponse.status === 401 || verifyResponse.status === 403) {
      console.log('✅ User successfully deleted (401/403 response)');
    } else if (verifyResponse.ok) {
      console.log('❌ User still exists after deletion');
      const userData = await verifyResponse.json();
      console.log('   User data:', userData);
    } else {
      console.log('✅ User deletion verified (non-200 response)');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

// Run the debug
debugAccountDeletion();
