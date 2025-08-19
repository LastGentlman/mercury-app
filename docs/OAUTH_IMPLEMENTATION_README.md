# OAuth Implementation with Supabase

This document explains how to set up and use the new OAuth functionality that has been added to the PedidoList App.

## ✨ Features Added

- **Google OAuth**: Login with Google accounts
- **Facebook OAuth**: Login with Facebook accounts  
- **Backward Compatibility**: Existing email/password authentication still works
- **Seamless Integration**: Users can switch between OAuth and traditional login
- **Profile Sync**: OAuth profiles are automatically synchronized

## 🚀 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the `pedidolist-app` directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration  
VITE_APP_TITLE=PedidoList App

# Supabase Configuration for OAuth
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# PWA Configuration
VITE_PWA_DISABLED=false
```

### 2. Supabase Setup

1. **Create a Supabase project**: Go to [https://app.supabase.com](https://app.supabase.com)
2. **Get your credentials**: 
   - Project URL: `https://your-project-ref.supabase.co`
   - Anon key: Found in Project Settings > API
3. **Configure OAuth providers**:
   - Go to Authentication > Providers
   - Enable Google and/or Facebook
   - Add your OAuth app credentials

### 3. Google OAuth Setup

1. **Create a Google Cloud Project**: [Google Cloud Console](https://console.cloud.google.com)
2. **Enable Google+ API**: APIs & Services > Library > Google+ API
3. **Create OAuth 2.0 credentials**:
   - APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: `https://your-project-ref.supabase.co/auth/v1/callback`
4. **Add credentials to Supabase**:
   - Client ID and Client Secret in Supabase Authentication settings

### 4. Facebook OAuth Setup

1. **Create a Facebook App**: [Facebook Developers](https://developers.facebook.com)
2. **Add Facebook Login product**
3. **Configure OAuth redirect URIs**: `https://your-project-ref.supabase.co/auth/v1/callback`
4. **Add credentials to Supabase**:
   - App ID and App Secret in Supabase Authentication settings

## 🎯 Usage Examples

### Using the Enhanced useAuth Hook

```tsx
import { useAuth } from '../hooks/useAuth'

function LoginPage() {
  const { 
    loginWithGoogle, 
    loginWithFacebook, 
    login, 
    user, 
    isAuthenticated,
    isSocialLoginLoading,
    provider 
  } = useAuth()

  return (
    <div>
      {/* OAuth Buttons */}
      <button onClick={loginWithGoogle} disabled={isSocialLoginLoading}>
        Login with Google
      </button>
      
      <button onClick={loginWithFacebook} disabled={isSocialLoginLoading}>
        Login with Facebook
      </button>

      {/* Traditional login form still works */}
      <form onSubmit={(e) => {
        e.preventDefault()
        login({ email: 'user@example.com', password: 'password' })
      }}>
        {/* Email/password form */}
      </form>

      {/* Display user info */}
      {isAuthenticated && (
        <div>
          <p>Welcome, {user?.name}!</p>
          <p>Provider: {provider}</p>
          {user?.avatar_url && <img src={user.avatar_url} alt="Avatar" />}
        </div>
      )}
    </div>
  )
}
```

### Using the SocialLoginButtons Component

```tsx
import { SocialLoginButtons } from '../components/SocialLoginButtons'

function LoginForm() {
  return (
    <div>
      <SocialLoginButtons />
      
      {/* Your existing email/password form */}
      <form>
        {/* ... */}
      </form>
    </div>
  )
}
```

## 🔧 API Reference

### New useAuth Methods

```typescript
interface AuthHook {
  // Existing methods (unchanged)
  login: (credentials: LoginCredentials) => Promise<LoginResponse>
  register: (userData: RegisterCredentials) => Promise<RegistrationResponse>
  logout: () => Promise<void>
  
  // NEW: OAuth methods
  loginWithGoogle: () => void
  loginWithFacebook: () => void
  socialLogin: (options: SocialLoginOptions) => Promise<any>
  
  // Enhanced state
  provider: string // 'google' | 'facebook' | 'email'
  isSocialLoginLoading: boolean
}
```

### User Interface Updates

```typescript
interface User {
  id: string
  email: string
  name?: string
  businessId?: string
  role?: 'owner' | 'employee'
  avatar_url?: string    // NEW: For OAuth profile pictures
  provider?: string      // NEW: Authentication provider
}
```

## 🔄 Migration Guide

The implementation is **100% backward compatible**. Existing users can continue using email/password authentication without any changes.

### For Existing Users
- No action required
- Existing login flows work unchanged
- Users can optionally link their accounts with OAuth providers

### For New Users
- Can choose between traditional signup or OAuth
- OAuth users get automatic profile information
- Seamless experience across all authentication methods

## 🛠 Development Notes

### Auth Flow Priority
1. **Check Supabase session** (OAuth users)
2. **Fallback to localStorage token** (traditional users)
3. **Return null if neither exists**

### Session Management
- OAuth sessions managed by Supabase automatically
- Traditional sessions managed via localStorage tokens
- Logout handles both session types gracefully

### Error Handling
- All error messages translated to Spanish
- Graceful fallbacks for network issues
- Comprehensive error logging

## 🔒 Security Considerations

- OAuth tokens managed securely by Supabase
- Traditional JWT tokens remain in localStorage (existing behavior)
- PKCE flow for OAuth (handled by Supabase)
- Automatic token refresh for OAuth sessions

## 🚨 Troubleshooting

### Common Issues

1. **OAuth redirect not working**
   - Check redirect URIs in OAuth provider settings
   - Ensure Supabase URL is correct in environment variables

2. **"Provider not enabled" error**
   - Verify OAuth providers are enabled in Supabase dashboard
   - Check that credentials are properly configured

3. **Environment variables not loading**
   - Restart development server after adding `.env.local`
   - Verify variable names start with `VITE_`

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', 'supabase:*')
```

## 📝 Next Steps

- [ ] Add more OAuth providers (GitHub, Twitter, etc.)
- [ ] Implement account linking (merge OAuth and traditional accounts)  
- [ ] Add profile management for OAuth users
- [ ] Enhanced offline support for OAuth sessions 