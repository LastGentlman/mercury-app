# Loop Prevention Tests

This directory contains comprehensive tests for the loop prevention fixes implemented to resolve the login loop and API request loop issues.

## Test Structure

### Frontend Tests

#### 1. **Redirect Manager Tests** (`utils/redirectManager.test.ts`)
- Tests the `RedirectManager` class functionality
- Verifies loop prevention mechanisms
- Tests throttling and redirect count limits
- Ensures proper timeout handling

#### 2. **CSRF Hook Tests** (`hooks/useCSRF.test.tsx`)
- Tests CSRF token management
- Verifies throttling of token refresh requests
- Tests error handling for authentication failures
- Ensures proper request handling

#### 3. **Dashboard Stats Hook Tests** (`hooks/useDashboardStats.test.tsx`)
- Tests dashboard statistics API calls
- Verifies 500 error handling
- Tests authentication token management
- Ensures no infinite retries

#### 4. **Orders Hook Tests** (`hooks/useOrders.test.tsx`)
- Tests orders API calls
- Verifies error handling for 401/500 errors
- Tests offline/online data handling
- Ensures proper cache configuration

### Integration Tests

#### 5. **Login Flow Integration Tests** (`integration/login-flow.test.tsx`)
- Tests complete authentication flow
- Verifies redirect logic
- Tests OAuth callback handling
- Ensures no redirect loops

#### 6. **Loop Prevention Integration Tests** (`integration/loop-prevention.test.tsx`)
- Comprehensive tests for all loop prevention mechanisms
- Tests OAuth state change throttling
- Verifies API request loop prevention
- Tests redirect loop prevention
- Ensures proper cache and performance

### Backend Tests

#### 7. **Dashboard Stats Endpoint Tests** (`../Backend/tests/dashboard.test.ts`)
- Tests the dashboard stats API endpoint
- Verifies mock data response
- Tests authentication and authorization
- Ensures proper error handling

## Running Tests

### Run All Loop Prevention Tests
```bash
./test-loop-fixes.sh
```

### Run Individual Test Suites
```bash
# Frontend tests
npm run test tests/utils/redirectManager.test.ts
npm run test tests/hooks/useCSRF.test.tsx
npm run test tests/hooks/useDashboardStats.test.tsx
npm run test tests/hooks/useOrders.test.tsx
npm run test tests/integration/login-flow.test.tsx
npm run test tests/integration/loop-prevention.test.tsx

# Backend tests
cd ../Backend
npm test tests/dashboard.test.ts
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Coverage

The tests cover the following loop prevention mechanisms:

### 1. **OAuth State Change Loop Prevention**
- ✅ Event throttling (2-second minimum between events)
- ✅ Prevents unnecessary query invalidation
- ✅ Proper event handling

### 2. **API Request Loop Prevention**
- ✅ No retries on 401/500 errors
- ✅ Reduced retry counts
- ✅ Proper error handling
- ✅ Cache optimization

### 3. **CSRF Token Loop Prevention**
- ✅ Request throttling (5-second minimum)
- ✅ State tracking to prevent concurrent requests
- ✅ Proper error handling

### 4. **Redirect Loop Prevention**
- ✅ Maximum redirect count (5 attempts)
- ✅ Redirect throttling (1-second minimum)
- ✅ Proper state management
- ✅ Timeout handling

### 5. **Cache and Performance**
- ✅ Increased cache times (5 minutes stale, 10 minutes cache)
- ✅ Disabled auto-refetch on window focus
- ✅ Proper query configuration

## Test Setup

The tests use the following setup:

- **Vitest** for test runner
- **React Testing Library** for component testing
- **TanStack Query** for API testing
- **Mock Service Worker** for API mocking
- **Custom mocks** for Supabase and other services

## Mocking Strategy

### Frontend Mocks
- `AuthService` - Authentication service
- `Supabase` - Database client
- `localStorage` - Browser storage
- `fetch` - HTTP requests
- `useOfflineSync` - Offline state management

### Backend Mocks
- `getSupabaseClient` - Database client
- `getUserFromToken` - Token validation
- `getBusinessContext` - Business context
- `logXSSAttempt` - Security logging

## Expected Results

All tests should pass, indicating that:

1. ✅ **No infinite loops** in authentication flow
2. ✅ **No infinite API requests** on errors
3. ✅ **Proper error handling** for all scenarios
4. ✅ **Efficient caching** to reduce API calls
5. ✅ **Robust redirect management** to prevent loops

## Troubleshooting

### Common Issues

1. **Tests failing due to async operations**
   - Use `waitFor` for async operations
   - Ensure proper cleanup in `afterEach`

2. **Mock not working correctly**
   - Check mock implementation
   - Ensure mocks are cleared between tests

3. **Timing issues**
   - Use `act` for state updates
   - Add appropriate delays for timeouts

### Debug Mode

Run tests with debug output:
```bash
npm run test -- --reporter=verbose
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use descriptive test names
3. Include both positive and negative test cases
4. Ensure proper cleanup
5. Add appropriate mocks
6. Update this README if needed
