# 🧪 Testing Instructions - Account Deletion Fix

## 🎯 Current Status

✅ **PWA Disabled** - No more workbox errors  
✅ **Backend Running** - Account deletion endpoint available  
✅ **Aggressive Supabase Cleanup** - Multiple signOut attempts  
✅ **Enhanced Verification** - Backend deletion verification  

## 🚀 Testing Steps

### 1. Prepare Environment
```bash
# Backend should be running (already started)
cd ../Backend && deno run --allow-all main.ts

# Frontend is built without PWA
# No need to rebuild unless you make changes
```

### 2. Clear Browser Completely
1. **Open DevTools** (F12)
2. **Go to Application tab**
3. **Clear all storage:**
   - Clear Storage > Clear site data
   - Service Workers > Unregister all (if any)
   - Local Storage > Clear all
   - Session Storage > Clear all
   - IndexedDB > Delete all databases
4. **Hard refresh** (Ctrl+Shift+R)

### 3. Test Account Deletion
1. **Navigate to** http://localhost:3000
2. **Login** with your test account
3. **Go to Settings** (click avatar > Configuración)
4. **Scroll to "Eliminar cuenta"**
5. **Click "Eliminar cuenta permanentemente"**
6. **Type "ELIMINAR"** in confirmation field
7. **Click "Eliminar cuenta permanentemente"**
8. **Confirm in SweetAlert2** ("Sí, eliminar cuenta")

### 4. Expected Behavior

#### ✅ **Success Scenario:**
```
Frontend Console:
✅ Account deletion request successful
⏳ Waiting for backend deletion to complete...
🔍 Verifying account deletion...
🔄 Starting aggressive Supabase session cleanup...
✅ SignOut attempt 1 completed
✅ SignOut attempt 2 completed
...
✅ Supabase session successfully cleared
✅ Backend confirms user is deleted (401/403 response)
🧹 Starting complete authentication cleanup...
✅ Complete cleanup finished

Backend Terminal:
🗑️ Starting cascade deletion for user: [user-id]
✅ All dependent rows deleted/updated successfully
✅ Account successfully deleted for user: [email] ([id])
```

#### ❌ **If Still Failing:**
```
Frontend Console:
⚠️ Supabase session still exists after aggressive cleanup: [email]
⚠️ Backend still recognizes user - deletion may not be complete

Backend Terminal:
Error during cascade deletion: [error details]
```

## 🔧 Debugging Tools

### 1. Backend Debug Script
```bash
node debug-account-deletion.js
```
- Enter your auth token when prompted
- Will test backend deletion step by step

### 2. Manual Backend Test
```bash
# Test if backend is running
curl http://localhost:3030/api/health

# Test user endpoint (replace TOKEN)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3030/api/auth/me
```

### 3. Database Verification
If deletion still fails, check database constraints:
```sql
-- Check remaining FK constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
  AND ccu.table_name = 'profiles';
```

## 🎯 Success Criteria

After successful deletion:
- ✅ **No workbox errors** (PWA disabled)
- ✅ **User redirected to /auth**
- ✅ **No persistent session** in console
- ✅ **Backend logs show successful deletion**
- ✅ **Clean browser storage**

## 🚨 If Issues Persist

### Option 1: Check Backend Logs
Look for these specific errors in backend terminal:
- `Error during cascade deletion`
- `Error deleting profile`
- `Error deleting user from auth`

### Option 2: Manual Database Cleanup
If automatic deletion fails, use the SQL from `ACCOUNT_DELETION_FIX.md`

### Option 3: Verify Supabase Admin API
Check if `supabase.auth.admin.deleteUser()` is working:
```javascript
// In browser console after deletion attempt
const { data, error } = await supabase.auth.getSession()
console.log('Session:', data.session)
console.log('Error:', error)
```

## 📋 Test Checklist

- [ ] Backend running on port 3030
- [ ] Frontend built without PWA
- [ ] Browser storage completely cleared
- [ ] User can login successfully
- [ ] Account deletion process starts
- [ ] Backend logs show cascade deletion
- [ ] Frontend logs show aggressive cleanup
- [ ] User redirected to /auth
- [ ] No persistent session in console
- [ ] No workbox errors

## 🎉 Expected Result

**Perfect scenario:**
1. User clicks delete account
2. Backend deletes all related data
3. Frontend aggressively cleans Supabase session
4. User redirected to /auth with clean state
5. No errors in console
6. No persistent authentication

**The key improvement:** Multiple aggressive signOut attempts should finally clear the persistent Supabase session that was causing the user to remain authenticated.
