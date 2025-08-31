// Debug script for auth callback navigation issue
console.log('🔧 Auth Callback Debug Script Loaded')

// Check current URL and parameters
function debugAuthCallback() {
  const currentUrl = globalThis.window.location.href
  const urlParams = new URLSearchParams(globalThis.window.location.search)
  const urlHash = globalThis.window.location.hash
  
  console.log('📍 Current URL:', currentUrl)
  console.log('🔍 URL Parameters:', Object.fromEntries(urlParams))
  console.log('🔗 URL Hash:', urlHash)
  
  // Check if we're stuck on callback
  if (currentUrl.includes('/auth/callback')) {
    console.log('⚠️ Detected stuck on auth callback')
    
    // Check for OAuth parameters
    const hasOAuthParams = urlHash.includes('access_token') || 
                          urlHash.includes('code') ||
                          urlParams.has('access_token') ||
                          urlParams.has('code')
    
    console.log('🔑 OAuth parameters detected:', hasOAuthParams)
    
    if (hasOAuthParams) {
      console.log('✅ OAuth parameters found, attempting manual navigation...')
      
      // Try to navigate to dashboard
      setTimeout(() => {
        console.log('🎯 Attempting navigation to /dashboard')
        globalThis.window.location.href = '/dashboard'
      }, 2000)
    } else {
      console.log('❌ No OAuth parameters found, redirecting to auth page')
      globalThis.window.location.href = '/auth'
    }
  }
}

// Auto-run debug if on callback page
if (globalThis.window.location.pathname.includes('/auth/callback')) {
  console.log('🚀 Auto-running auth callback debug...')
  debugAuthCallback()
}

// Export for manual use
globalThis.window.debugAuthCallback = debugAuthCallback
console.log('💡 Use debugAuthCallback() to manually debug auth callback') 