// Background Sync Configuration

export const BACKGROUND_SYNC_CONFIG = {
  // Sync tags
  SYNC_TAG: 'background-sync',
  PERIODIC_SYNC_TAG: 'periodic-sync',
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  
  // Periodic sync settings
  MIN_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours minimum
  
  // Cache settings
  CACHE_NAME: 'pedidolist-app-v1',
  OFFLINE_CACHE: 'pedidolist-offline-v1',
  
  // Database settings
  DB_NAME: 'PedidoListDB',
  DB_VERSION: 1,
  
  // API endpoints
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3030',
  
  // Sync batch size
  BATCH_SIZE: 10,
  
  // Timeout settings
  SYNC_TIMEOUT: 30000, // 30 seconds
  REQUEST_TIMEOUT: 10000, // 10 seconds
} as const

// Background sync status messages
export const SYNC_MESSAGES = {
  STARTED: 'SYNC_STARTED',
  COMPLETED: 'SYNC_COMPLETED',
  ERROR: 'SYNC_ERROR',
  GET_AUTH_TOKEN: 'GET_AUTH_TOKEN',
} as const

// Entity types for sync
export const ENTITY_TYPES = {
  ORDER: 'order',
  PRODUCT: 'product',
} as const

// Sync actions
export const SYNC_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
} as const

// Error types
export const SYNC_ERRORS = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const 