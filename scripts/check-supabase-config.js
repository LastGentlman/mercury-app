#!/usr/bin/env node

import process from "node:process";

/**
 * 🔍 Supabase Configuration Check for Google OAuth
 */

console.log('🔍 Supabase Configuration Check for Google OAuth')
console.log('================================================\n')

console.log('📋 Environment Variables:')
console.log('- VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('- VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')

console.log('\n🔧 Supabase Dashboard Configuration:')
console.log('1. Go to Supabase Dashboard → Authentication → Providers')
console.log('2. Click on Google provider')
console.log('3. Verify these settings:')
console.log('   ✅ Enabled: true')
console.log('   ✅ Client ID: [your-google-client-id]')
console.log('   ✅ Client Secret: [your-google-client-secret]')
console.log('   ✅ Redirect URL: https://your-project.supabase.co/auth/v1/callback')

console.log('\n🔧 Google Cloud Console Configuration:')
console.log('1. Go to Google Cloud Console → APIs & Services → Credentials')
console.log('2. Find your OAuth 2.0 Client ID')
console.log('3. Add Authorized Redirect URIs:')
console.log('   - https://your-project.supabase.co/auth/v1/callback')
console.log('   - http://localhost:3000/auth/callback (for development)')

console.log('\n🔧 OAuth Consent Screen:')
console.log('1. Go to Google Cloud Console → APIs & Services → OAuth consent screen')
console.log('2. Add these scopes:')
console.log('   - openid')
console.log('   - email')
console.log('   - profile')
console.log('   - https://www.googleapis.com/auth/userinfo.profile')
console.log('   - https://www.googleapis.com/auth/userinfo.email')

console.log('\n🔧 Enable Required APIs:')
console.log('1. Go to Google Cloud Console → APIs & Services → Library')
console.log('2. Search and enable:')
console.log('   - Google+ API')
console.log('   - Google People API')

console.log('\n🔧 Test the Configuration:')
console.log('1. Clear browser storage: localStorage.clear()')
console.log('2. Logout completely')
console.log('3. Login with Google again')
console.log('4. Check if avatar appears')

console.log('\n🔧 If Still Not Working:')
console.log('1. Check Supabase logs in dashboard')
console.log('2. Verify Google OAuth consent screen')
console.log('3. Test with a different Google account')
console.log('4. Check if Google account has profile picture')

console.log('\n✅ Configuration check completed!') 