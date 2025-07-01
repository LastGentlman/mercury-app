# Authentication System - PedidoList

This document explains the authentication system implemented in the PedidoList application.

## Overview

The authentication system uses:
- **Backend**: Deno + Hono + Supabase
- **Frontend**: React + TanStack Router + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui components

## Backend Authentication Endpoints

The backend provides the following authentication endpoints:

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (requires authentication)
- `POST /api/auth/confirm-email` - Confirm email (development only)

## Frontend Authentication Features

### 1. Authentication Hook (`useAuth`)

Located in `src/hooks/useAuth.ts`, this hook provides:

```typescript
const { 
  user,           // Current user object
  isAuthenticated, // Boolean indicating if user is logged in
  isLoading,      // Boolean indicating if auth state is loading
  login,          // Login mutation
  register,       // Register mutation
  logout,         // Logout mutation
  refetchUser     // Function to refetch user data
} = useAuth()
```

### 2. Authentication Page (`/auth`)

Located in `src/routes/auth.tsx`, this page provides:
- Login form
- Registration form
- Toggle between login and register modes
- **Success messages after registration**
- **Email confirmation flow**
- Error handling and validation
- Loading states

### 3. Success Message Component

Located in `src/components/SuccessMessage.tsx`, this component provides:
- Reusable success/info/warning messages
- Different styles for different message types
- Support for email display
- Consistent styling across the app

### 4. Protected Routes

Use the `ProtectedRoute` component to protect routes that require authentication:

```typescript
import { ProtectedRoute } from '../components/ProtectedRoute'

function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  )
}
```

### 5. Header Component

The header automatically shows:
- User information when authenticated
- Login/Signup buttons when not authenticated
- Logout functionality
- Loading states

## Registration Flow

### 1. User Registration
1. User fills out registration form (name, email, password)
2. Form validation ensures all fields are completed
3. Registration request is sent to backend

### 2. Success Message
After successful registration:
- User sees a success message: "¡Registro Exitoso!"
- Email confirmation screen is displayed
- User is informed that a confirmation email has been sent
- Email address is displayed for verification

### 3. Email Confirmation
- Supabase automatically sends confirmation email
- User must click the link in the email to verify their account
- After verification, user can login normally

### 4. User Actions
From the confirmation screen, users can:
- Go to login page to sign in (after email verification)
- Create another account
- See helpful tips about checking spam folder

## How to Use

### 1. Starting the Backend

```bash
cd Backend
deno run --allow-net --allow-env --allow-read main.ts
```

The backend will start on `http://localhost:3030`

### 2. Starting the Frontend

```bash
cd mercury-app
npm run dev
```

The frontend will start on `http://localhost:3000`

### 3. Authentication Flow

1. **Registration**: Users can create a new account with email, password, and name
2. **Success Message**: Clear confirmation that registration was successful
3. **Email Confirmation**: Supabase handles email verification automatically
4. **Login**: Users can sign in after email verification
5. **Session Management**: Tokens are stored in localStorage
6. **Protected Routes**: Unauthenticated users are redirected to `/auth`

### 4. Testing the Authentication

1. Visit `http://localhost:3000`
2. Click "Get Started" or "Sign In"
3. Create a new account with your email, password, and name
4. You'll see a success message and email confirmation screen
5. Check your email and click the confirmation link
6. Return to the app and login with your credentials
7. You'll be redirected to the dashboard
8. Use the logout button to sign out

## File Structure

```
mercury-app/src/
├── hooks/
│   └── useAuth.ts              # Authentication hook
├── components/
│   ├── ui/                     # UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── Header.tsx              # Navigation header
│   ├── ProtectedRoute.tsx      # Route protection component
│   └── SuccessMessage.tsx      # Success message component
└── routes/
    ├── index.tsx               # Home page
    ├── auth.tsx                # Authentication page
    └── dashboard.tsx           # Dashboard (protected)
```

## Security Features

- JWT tokens stored in localStorage
- Automatic token validation on app load
- Protected routes with automatic redirects
- Error handling for invalid tokens
- CORS configuration for secure API communication
- Email verification required for account activation

## User Experience Features

- **Clear Success Messages**: Users get immediate feedback on successful registration
- **Email Confirmation Flow**: Dedicated screen explaining next steps
- **Form Validation**: Real-time validation with helpful error messages
- **Loading States**: Visual feedback during API calls
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Proper labels and keyboard navigation

## Development Notes

- Supabase handles email confirmation automatically
- All API calls include proper error handling
- The UI is responsive and follows modern design patterns
- Success messages are localized in Spanish for better user experience
- The system gracefully handles email confirmation delays 