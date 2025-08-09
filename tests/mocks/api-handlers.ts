import { http, HttpResponse } from 'msw'
import { validateProduct, validateOrder, validateClient, validateBusiness as _validateBusinessSchema } from '../../src/lib/validation/schemas.ts'

// Mock data
const mockBusinesses = [
  {
    id: 'business-1',
    name: 'Restaurante Los Sabores',
    ownerId: 'user-1',
    businessType: 'restaurant',
    taxRegimeCode: '612',
    address: 'Av. Principal 123, CDMX',
    phone: '+52 555 123 4567',
    email: 'contacto@lossabores.com',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
]

const mockProducts = [
  {
    id: 1,
    businessId: 'business-1',
    name: 'Tacos al Pastor',
    description: 'Deliciosos tacos con carne al pastor',
    price: 45,
    cost: 25,
    categoryId: 'cat-food',
    satCode: '50202301',
    taxRate: 0.16,
    stock: 50,
    isActive: true,
    syncStatus: 'synced',
    createdAt: '2024-01-01T10:00:00.000Z',
    updatedAt: '2024-01-01T10:00:00.000Z',
    clientGeneratedId: 'local-product-1'
  },
  {
    id: 2,
    businessId: 'business-1',
    name: 'Coca Cola',
    description: 'Refresco de cola 600ml',
    price: 25,
    cost: 15,
    categoryId: 'cat-drinks',
    satCode: '50202306',
    taxRate: 0.16,
    stock: 100,
    isActive: true,
    syncStatus: 'synced',
    createdAt: '2024-01-01T10:30:00.000Z',
    updatedAt: '2024-01-01T10:30:00.000Z',
    clientGeneratedId: 'local-product-2'
  }
]

const mockOrders = [
  {
    id: 'order-1',
    business_id: 'business-1',
    branch_id: 'branch-1',
    employee_id: 'user-1',
    client_name: 'María González',
    client_phone: '+52 555 987 6543',
    total: 95,
    delivery_date: '2024-01-15',
    delivery_time: '14:30',
    notes: 'Sin cebolla en los tacos',
    status: 'pending',
    created_at: '2024-01-15T12:00:00.000Z',
    last_modified_at: '2024-01-15T12:00:00.000Z',
    items: [
      {
        id: 1,
        order_id: 'order-1',
        product_id: '1',
        product_name: 'Tacos al Pastor',
        quantity: 2,
        unit_price: 45,
        subtotal: 90
      },
      {
        id: 2,
        order_id: 'order-1',
        product_id: '2',
        product_name: 'Coca Cola',
        quantity: 1,
        unit_price: 25,
        subtotal: 25
      }
    ]
  }
]

const mockClients = [
  {
    id: 'client-1',
    name: 'María González',
    email: 'maria@example.com',
    phone: '+52 555 987 6543',
    address: 'Calle Revolución 456, CDMX',
    notes: 'Cliente frecuente',
    total_orders: 15,
    total_spent: 1420.50,
    last_order_date: '2024-01-15T12:00:00.000Z',
    business_id: 'business-1',
    is_active: true,
    created_at: '2023-06-01T00:00:00.000Z',
    updated_at: '2024-01-15T12:00:00.000Z'
  }
]

const mockCategories = [
  {
    id: 1,
    businessId: 'business-1',
    categoryId: 'cat-food',
    categoryName: 'Comida',
    icon: '🍽️',
    satCode: '50202301',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastModifiedAt: '2024-01-01T00:00:00.000Z',
    syncStatus: 'synced'
  },
  {
    id: 2,
    businessId: 'business-1',
    categoryId: 'cat-drinks',
    categoryName: 'Bebidas',
    icon: '🥤',
    satCode: '50202306',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    lastModifiedAt: '2024-01-01T00:00:00.000Z',
    syncStatus: 'synced'
  }
]

// Helper function to simulate network delays
const delay = (ms: number = Math.random() * 500 + 100) => 
  new Promise(resolve => setTimeout(resolve, ms))

// Helper function to simulate errors based on probability
const shouldSimulateError = (probability: number = 0.1) => Math.random() < probability

export const apiHandlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    await delay()
    
    const body = await request.json() as { email: string; password: string }
    
    if (!body.email || !body.password) {
      return new Response(
        JSON.stringify({ error: 'Email y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (body.email === 'test@example.com' && body.password === 'password') {
      return HttpResponse.json({
        success: true,
        data: {
          user: {
            id: 'user-1',
            email: 'test@example.com',
            name: 'Usuario de Prueba',
            businessId: 'business-1',
            role: 'owner'
          },
          token: 'mock-jwt-token'
        }
      })
    }

    return new Response(
      JSON.stringify({ error: 'Credenciales inválidas' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  http.post('/api/auth/logout', async () => {
    await delay()
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await delay()
    
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Token de autenticación requerido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Usuario de Prueba',
        businessId: 'business-1',
        role: 'owner'
      }
    })
  }),

  // Business endpoints
  http.get('/api/businesses/:businessId', async ({ params }) => {
    await delay()
    
    if (shouldSimulateError()) {
      return new Response(
        JSON.stringify({ error: 'Error interno del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const business = mockBusinesses.find(b => b.id === params.businessId)
    if (!business) {
      return new Response(
        JSON.stringify({ error: 'Negocio no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({
      success: true,
      data: business
    })
  }),

  // Product endpoints
  http.get('/api/businesses/:businessId/products', async ({ params, request }) => {
    await delay()
    
    if (shouldSimulateError()) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener productos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const search = url.searchParams.get('search')
    const categoryId = url.searchParams.get('categoryId')

    let filteredProducts = mockProducts.filter(p => p.businessId === params.businessId)

    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === categoryId)
    }

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

    return HttpResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        page,
        pageSize: limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
        totalCount: filteredProducts.length,
        hasNext: endIndex < filteredProducts.length,
        hasPrevious: page > 1
      }
    })
  }),

  http.post('/api/businesses/:businessId/products', async ({ request, params }) => {
    await delay()
    
    const body = await request.json() as Record<string, unknown>
    
    try {
      // Validate product data
      const validatedProduct = validateProduct({
        ...body,
        businessId: params.businessId,
        id: mockProducts.length + 1,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      mockProducts.push(validatedProduct as typeof mockProducts[0])

      return new Response(
        JSON.stringify({
          success: true,
          data: validatedProduct
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Datos de producto inválidos', details: error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),

  http.put('/api/businesses/:businessId/products/:productId', async ({ request, params }) => {
    await delay()
    
    const body = await request.json() as Record<string, unknown>
    const productIndex = mockProducts.findIndex(p => p.id.toString() === params.productId)
    
    if (productIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Producto no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    try {
      const updatedProduct = {
        ...mockProducts[productIndex],
        ...body,
        updatedAt: new Date().toISOString()
      }

      validateProduct(updatedProduct)
      mockProducts[productIndex] = updatedProduct as typeof mockProducts[0]

      return HttpResponse.json({
        success: true,
        data: updatedProduct
      })
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Datos de producto inválidos', details: error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),

  // Order endpoints
  http.get('/api/businesses/:businessId/orders', async ({ params, request }) => {
    await delay()
    
    if (shouldSimulateError()) {
      return new Response(
        JSON.stringify({ error: 'Error al obtener pedidos' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    let filteredOrders = mockOrders.filter(o => o.business_id === params.businessId)

    if (status) {
      filteredOrders = filteredOrders.filter(o => o.status === status)
    }

    if (dateFrom) {
      filteredOrders = filteredOrders.filter(o => o.delivery_date >= dateFrom)
    }

    if (dateTo) {
      filteredOrders = filteredOrders.filter(o => o.delivery_date <= dateTo)
    }

    return HttpResponse.json({
      success: true,
      data: filteredOrders
    })
  }),

  http.post('/api/businesses/:businessId/orders', async ({ request, params }) => {
    await delay()
    
    const body = await request.json() as Record<string, unknown>
    
    try {
      const newOrder = {
        id: `order-${Date.now()}`,
        business_id: params.businessId,
        branch_id: 'branch-1',
        employee_id: 'user-1',
        ...body,
        status: 'pending',
        created_at: new Date().toISOString(),
        last_modified_at: new Date().toISOString()
      }

      validateOrder(newOrder)
      mockOrders.push(newOrder as typeof mockOrders[0])

      return new Response(
        JSON.stringify({
          success: true,
          data: newOrder
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Datos de pedido inválidos', details: error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),

  http.patch('/api/businesses/:businessId/orders/:orderId/status', async ({ request, params }) => {
    await delay()
    
    const body = await request.json() as { status: string }
    const orderIndex = mockOrders.findIndex(o => o.id === params.orderId)
    
    if (orderIndex === -1) {
      return new Response(
        JSON.stringify({ error: 'Pedido no encontrado' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled']
    if (!validStatuses.includes(body.status)) {
      return new Response(
        JSON.stringify({ error: 'Estado de pedido inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    mockOrders[orderIndex] = {
      ...mockOrders[orderIndex],
      status: body.status,
      last_modified_at: new Date().toISOString()
    } as typeof mockOrders[0]

    return HttpResponse.json({
      success: true,
      data: mockOrders[orderIndex]
    })
  }),

  // Client endpoints
  http.get('/api/businesses/:businessId/clients', async ({ params }) => {
    await delay()
    
    const filteredClients = mockClients.filter(c => c.business_id === params.businessId)

    return HttpResponse.json({
      success: true,
      data: filteredClients
    })
  }),

  http.post('/api/businesses/:businessId/clients', async ({ request, params }) => {
    await delay()
    
    const body = await request.json() as Record<string, unknown>
    
    try {
      const newClient = {
        id: `client-${Date.now()}`,
        ...body,
        business_id: params.businessId,
        total_orders: 0,
        total_spent: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      validateClient(newClient)
      mockClients.push(newClient as typeof mockClients[0])

      return new Response(
        JSON.stringify({
          success: true,
          data: newClient
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Datos de cliente inválidos', details: error }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),

  // Business category endpoints
  http.get('/api/businesses/:businessId/categories', async ({ params }) => {
    await delay()
    
    const filteredCategories = mockCategories.filter(c => c.businessId === params.businessId)

    return HttpResponse.json({
      success: true,
      data: filteredCategories
    })
  }),

  // Sync endpoints
  http.post('/api/sync/create', async ({ request }) => {
    await delay()
    
    const body = await request.json() as { id: string; data: Record<string, unknown> & { name: string } }
    
    // Simulate occasional sync conflicts
    if (Math.random() < 0.05) {
      return new Response(
        JSON.stringify({
          error: 'Conflict detected',
          conflict: {
            entityId: body.id,
            clientVersion: body.data,
            serverVersion: { ...body.data, name: body.data.name + ' (Server)' }
          }
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: body.id,
        synced: true,
        timestamp: new Date().toISOString()
      }
    })
  }),

  http.post('/api/sync/update', async ({ request }) => {
    await delay()
    
    const body = await request.json() as { id: string }
    
    return HttpResponse.json({
      success: true,
      data: {
        id: body.id,
        synced: true,
        timestamp: new Date().toISOString()
      }
    })
  }),

  http.post('/api/sync/delete', async ({ request }) => {
    await delay()
    
    const body = await request.json() as { id: string }
    
    return HttpResponse.json({
      success: true,
      data: {
        id: body.id,
        deleted: true,
        timestamp: new Date().toISOString()
      }
    })
  }),

  // Dashboard stats
  http.get('/api/businesses/:businessId/stats', async ({ params }) => {
    await delay()
    
    return HttpResponse.json({
      success: true,
      data: {
        totalOrders: mockOrders.filter(o => o.business_id === params.businessId).length,
        totalRevenue: mockOrders
          .filter(o => o.business_id === params.businessId)
          .reduce((sum, order) => sum + order.total, 0),
        activeProducts: mockProducts.filter(p => p.businessId === params.businessId && p.isActive).length,
        totalClients: mockClients.filter(c => c.business_id === params.businessId).length,
        pendingOrders: mockOrders.filter(o => o.business_id === params.businessId && o.status === 'pending').length,
        lowStockProducts: mockProducts.filter(p => p.businessId === params.businessId && p.stock < 10).length
      }
    })
  }),

  // Error simulation endpoints
  http.get('/api/test/error/500', () => {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }),

  http.get('/api/test/error/timeout', async () => {
    await delay(10000) // Long delay to simulate timeout
    return HttpResponse.json({ success: true })
  }),

  http.get('/api/test/error/network', () => {
    return HttpResponse.error()
  })
]

// Additional handlers for OAuth providers
export const oauthHandlers = [
  http.get('/api/auth/google', () => {
    return HttpResponse.redirect('https://accounts.google.com/oauth/authorize?client_id=test')
  }),

  http.post('/api/auth/google/callback', async ({ request }) => {
    await delay()
    
    const body = await request.json() as { code: string }
    
    if (!body.code) {
      return new Response(
        JSON.stringify({ error: 'Authorization code required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: {
          id: 'google-user-1',
          email: 'user@gmail.com',
          name: 'Google User',
          provider: 'google',
          businessId: 'business-1'
        },
        token: 'google-jwt-token'
      }
    })
  })
]

// Handlers for testing specific scenarios
export const testScenarioHandlers = [
  // Slow network simulation
  http.get('/api/test/slow', async () => {
    await delay(3000)
    return HttpResponse.json({ success: true, message: 'Slow response' })
  }),

  // Rate limiting simulation
  http.get('/api/test/rate-limit', () => {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    )
  }),

  // Maintenance mode simulation
  http.get('/api/test/maintenance', () => {
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  })
]

export const allHandlers = [
  ...apiHandlers,
  ...oauthHandlers,
  ...testScenarioHandlers
] 