import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock health check endpoint
  http.get('*/health', () => {
    return HttpResponse.json({ status: 'ok', message: 'Server is running' })
  }),

  // Mock API root endpoint
  http.get('*/', () => {
    return HttpResponse.json({ message: 'API is running' })
  }),

  // Mock login endpoint
  http.post('*/api/auth/login', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        },
        session: {
          access_token: 'mock-jwt-token'
        }
      })
    }
    
    return HttpResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  }),

  // Mock register endpoint
  http.post('*/api/auth/register', async ({ request }) => {
    const body = await request.json() as any
    
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: 'User with this email already exists.' },
        { status: 400 }
      )
    }
    
    return HttpResponse.json({
      message: 'User registered successfully',
      user: {
        id: '2',
        email: body.email,
        name: body.name
      }
    })
  }),

  // Mock API auth endpoint (GET)
  http.get('*/api/auth', () => {
    return HttpResponse.json({ 
      message: 'Auth API endpoint',
      endpoints: ['login', 'register', 'logout', 'profile']
    })
  }),

  // Mock profile endpoint
  http.get('*/api/auth/profile', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (authHeader === 'Bearer mock-jwt-token' || authHeader === 'Bearer existing-token') {
      return HttpResponse.json({
        profile: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User'
        }
      })
    }
    
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }),

  // Mock logout endpoint
  http.post('*/api/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' })
  })
] 