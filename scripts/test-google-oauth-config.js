#!/usr/bin/env node

import process from "node:process";

/**
 * 🔍 Google OAuth Configuration Test
 * 
 * This script helps diagnose why Google OAuth is not providing avatar URLs
 */

console.log('🔍 Google OAuth Configuration Test')
console.log('=====================================\n')

// Check environment variables
console.log('📋 Environment Variables:')
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('- VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing')

console.log('\n🔧 Supabase Configuration Checklist:')
console.log('1. Go to Supabase Dashboard → Authentication → Providers')
console.log('2. Enable Google provider')
console.log('3. Set Client ID and Client Secret')
console.log('4. Add authorized redirect URIs:')
console.log('   - http://localhost:3000/auth/callback')
console.log('   - https://pedidolist.com/auth/callback')
console.log('   - https://your-domain.com/auth/callback')

console.log('\n🔧 Google Cloud Console Checklist:')
console.log('1. Go to Google Cloud Console → APIs & Services → Credentials')
console.log('2. Find your OAuth 2.0 Client ID')
console.log('3. Add authorized redirect URIs:')
console.log('   - https://your-project.supabase.co/auth/v1/callback')
console.log('4. Enable Google+ API (if not already enabled)')
console.log('5. Enable Google People API')

console.log('\n🔧 OAuth Scopes Configuration:')
console.log('Current scopes in auth-service.ts:')
console.log('- https://www.googleapis.com/auth/userinfo.email')
console.log('- https://www.googleapis.com/auth/userinfo.profile')
console.log('')
console.log('Alternative scopes to try:')
console.log('- openid email profile')
console.log('- https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')

console.log('\n🔧 Debugging Steps:')
console.log('1. Clear browser storage: localStorage.clear()')
console.log('2. Clear session storage: sessionStorage.clear()')
console.log('3. Logout completely from Google')
console.log('4. Login again with Google')
console.log('5. Check browser console for OAuth debug logs')
console.log('6. Check Network tab for OAuth requests')

console.log('\n🔧 Common Issues:')
console.log('❌ Google app not verified (for production)')
console.log('❌ Incorrect redirect URIs')
console.log('❌ Missing required APIs in Google Cloud Console')
console.log('❌ OAuth consent screen not configured')
console.log('❌ Scopes not properly configured')

console.log('\n🔧 Next Steps:')
console.log('1. Verify Supabase Google provider configuration')
console.log('2. Check Google Cloud Console settings')
console.log('3. Test with different OAuth scopes')
console.log('4. Check browser console for detailed OAuth logs')
console.log('5. Verify redirect URIs match exactly')

console.log('\n📞 If issues persist:')
console.log('- Check Supabase logs in dashboard')
console.log('- Verify Google OAuth consent screen')
console.log('- Test with a different Google account')
console.log('- Check if Google account has profile picture')

console.log('\n✅ Test completed!') 