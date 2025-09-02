# Supabase Singleton Pattern Fix

## 🚨 Problem Identified

The application was experiencing **"Multiple GoTrueClient instances detected"** warnings in the browser console. This warning indicates that multiple Supabase client instances were being created, which can lead to:

- Undefined authentication behavior
- Session management conflicts
- Storage inconsistencies
- Performance issues

## 🔍 Root Cause Analysis

The issue was caused by **duplicate Supabase client creation** in two different files:

1. **`mercury-app/src/utils/supabase.ts`** - Main client creation
2. **`mercury-app/src/services/auth-service.ts`** - Duplicate client creation

Both files were calling `createClient()` independently, resulting in multiple GoTrueClient instances.

## ✅ Solution Implemented

### 1. Centralized Client Creation

**File: `mercury-app/src/utils/supabase.ts`**
```typescript
// ✅ SINGLE INSTANCE: Create Supabase client only once
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null
```

### 2. Shared Instance Import

**File: `mercury-app/src/services/auth-service.ts`**
```typescript
// ✅ IMPORTANT: Import the shared Supabase client instance to prevent multiple instances
// This prevents the "Multiple GoTrueClient instances" warning
import { supabase } from '../utils/supabase.ts'

export class AuthService {
  static supabase = supabase  // Use shared instance
  // ... rest of the class
}
```

## 🏗️ Architecture Pattern

```
┌─────────────────────────────────────┐
│           Frontend App              │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │    utils/supabase.ts        │    │
│  │  (SINGLE CLIENT CREATION)   │    │
│  └─────────────────────────────┘    │
│              │                      │
│              │ export { supabase }  │
│              │                      │
│  ┌─────────────────────────────┐    │
│  │   services/auth-service.ts  │    │
│  │   (IMPORTS SHARED CLIENT)   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   services/profile-service.ts│    │
│  │   (IMPORTS SHARED CLIENT)   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │   services/business-service.ts│   │
│  │   (IMPORTS SHARED CLIENT)   │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## 🚫 What NOT to Do

### ❌ Don't Create Multiple Clients
```typescript
// ❌ WRONG: Creating multiple instances
import { createClient } from '@supabase/supabase-js'

const supabase1 = createClient(url, key, options)
const supabase2 = createClient(url, key, options)  // This causes warnings!
```

### ❌ Don't Import createClient in Services
```typescript
// ❌ WRONG: Importing createClient in service files
import { createClient } from '@supabase/supabase-js'

// ❌ WRONG: Creating new client in service
const supabase = createClient(url, key, options)
```

## ✅ What TO Do

### ✅ Always Import Shared Instance
```typescript
// ✅ CORRECT: Import shared instance
import { supabase } from '../utils/supabase.ts'

export class MyService {
  static supabase = supabase  // Use shared instance
}
```

### ✅ Use Singleton Pattern
```typescript
// ✅ CORRECT: Single client creation
export const supabase = createClient(url, key, options)

// ✅ CORRECT: All other files import this
import { supabase } from './utils/supabase.ts'
```

## 🧪 Testing the Fix

### 1. Browser Console Check
1. Open browser developer tools
2. Check console for warnings
3. **Expected**: No "Multiple GoTrueClient instances" warnings
4. **If warnings persist**: Check for other files creating clients

### 2. Code Verification
```bash
# Search for any remaining createClient calls
grep -r "createClient" mercury-app/src/ --include="*.ts" --include="*.tsx"

# Should only show utils/supabase.ts
```

### 3. Import Verification
```bash
# Check all supabase imports
grep -r "import.*supabase" mercury-app/src/ --include="*.ts" --include="*.tsx"

# Should show imports from utils/supabase.ts
```

## 🔒 Prevention Guidelines

### 1. Code Review Checklist
- [ ] Only `utils/supabase.ts` calls `createClient()`
- [ ] All services import `{ supabase }` from utils
- [ ] No `createClient` imports in service files
- [ ] No dynamic client creation

### 2. Linting Rules
Consider adding ESLint rules to prevent:
- Multiple `createClient` calls
- `createClient` imports outside of utils/supabase.ts

### 3. Documentation
- Keep this document updated
- Reference in onboarding for new developers
- Include in code review guidelines

## 📊 Benefits of the Fix

1. **Eliminates Warnings**: No more "Multiple GoTrueClient instances" messages
2. **Improves Reliability**: Consistent authentication behavior
3. **Better Performance**: Single client instance, reduced memory usage
4. **Easier Debugging**: Clear client lifecycle and state
5. **Maintainability**: Centralized configuration management

## 🔄 Future Considerations

### 1. Environment-Specific Clients
If you need different clients for different environments:
```typescript
// ✅ CORRECT: Environment-specific configuration
export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: import.meta.env.PROD,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### 2. Client Configuration Updates
When updating client configuration:
1. Modify only `utils/supabase.ts`
2. Test thoroughly
3. Update this documentation
4. Notify team of changes

### 3. Testing Strategy
- Unit tests for singleton pattern
- Integration tests for client sharing
- E2E tests for authentication flows

## 📝 Summary

The fix ensures that:
- ✅ Only one Supabase client instance is created
- ✅ All services share the same client instance
- ✅ No more "Multiple GoTrueClient instances" warnings
- ✅ Improved authentication reliability
- ✅ Better code maintainability

**Remember**: Always import `{ supabase }` from `utils/supabase.ts` and never call `createClient()` elsewhere in the frontend code. 