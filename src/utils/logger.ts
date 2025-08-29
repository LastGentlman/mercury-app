/**
 * 📝 Logger - Consistent Logging Strategy
 * 
 * Proporciona logging estructurado y consistente con:
 * - Niveles de log apropiados
 * - Filtrado por entorno
 * - Formato estructurado
 * - Contexto de errores
 */

// 🎯 Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// 🎯 Environment-based log level
const getLogLevel = (): LogLevel => {
  if (import.meta.env.PROD) {
    return LogLevel.ERROR // Solo errores en producción
  }
  if (import.meta.env.DEV) {
    return LogLevel.DEBUG // Todo en desarrollo
  }
  return LogLevel.INFO // Info por defecto
}

// 🎯 Current log level
const CURRENT_LOG_LEVEL = getLogLevel()

// 🎯 Log context interface
export interface LogContext {
  component?: string
  action?: string
  userId?: string
  sessionId?: string
  requestId?: string
  [key: string]: unknown
}

// 🎯 Log entry interface
export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: LogContext
  error?: Error | undefined
}

// 🎯 Format log entry
const formatLogEntry = (entry: LogEntry): string => {
  const { timestamp, level, message, context, error } = entry
  
  let formatted = `[${timestamp}] ${LogLevel[level]}: ${message}`
  
  if (context && Object.keys(context).length > 0) {
    formatted += ` | Context: ${JSON.stringify(context)}`
  }
  
  if (error) {
    formatted += ` | Error: ${error.message}`
    if (error.stack) {
      formatted += ` | Stack: ${error.stack.split('\n')[1]?.trim()}`
    }
  }
  
  return formatted
}

// 🎯 Should log based on level
const shouldLog = (level: LogLevel): boolean => {
  return level >= CURRENT_LOG_LEVEL
}

// 🎯 Main logger class
class Logger {
  private context: LogContext = {}

  // 🎯 Set context for all subsequent logs
  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context }
  }

  // 🎯 Clear context
  clearContext(): void {
    this.context = {}
  }

  // 🎯 Add context for a single log
  withContext(context: Partial<LogContext>): Logger {
    const logger = new Logger()
    logger.context = { ...this.context, ...context }
    return logger
  }

  // 🎯 Debug logging
  debug(message: string, context?: Partial<LogContext>): void {
    if (!shouldLog(LogLevel.DEBUG)) return
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context: { ...this.context, ...context }
    }
    
    console.debug(formatLogEntry(entry))
  }

  // 🎯 Info logging
  info(message: string, context?: Partial<LogContext>): void {
    if (!shouldLog(LogLevel.INFO)) return
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context: { ...this.context, ...context }
    }
    
    console.info(formatLogEntry(entry))
  }

  // 🎯 Warning logging
  warn(message: string, context?: Partial<LogContext>): void {
    if (!shouldLog(LogLevel.WARN)) return
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context: { ...this.context, ...context }
    }
    
    console.warn(formatLogEntry(entry))
  }

  // 🎯 Error logging
  error(message: string, error?: Error, context?: Partial<LogContext>): void {
    if (!shouldLog(LogLevel.ERROR)) return
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: { ...this.context, ...context },
      error
    }
    
    console.error(formatLogEntry(entry))
  }

  // 🎯 Auth-specific logging
  auth = {
    login: (provider: string, context?: Partial<LogContext>) => {
      this.info(`🔐 User login initiated with ${provider}`, {
        action: 'login',
        provider,
        ...context
      })
    },

    success: (provider: string, userId?: string, context?: Partial<LogContext>) => {
      this.info(`✅ Login successful with ${provider}`, {
        action: 'login_success',
        provider,
        ...(userId && { userId }),
        ...context
      })
    },

    failure: (provider: string, error: string, context?: Partial<LogContext>) => {
      this.error(`❌ Login failed with ${provider}: ${error}`, undefined, {
        action: 'login_failure',
        provider,
        error,
        ...context
      })
    },

    logout: (userId?: string, context?: Partial<LogContext>) => {
      this.info(`🚪 User logout`, {
        action: 'logout',
        ...(userId && { userId }),
        ...context
      })
    },

    session: (action: 'check' | 'refresh' | 'expire', context?: Partial<LogContext>) => {
      this.debug(`🔄 Session ${action}`, {
        action: `session_${action}`,
        ...context
      })
    }
  }

  // 🎯 API-specific logging
  api = {
    request: (method: string, url: string, context?: Partial<LogContext>) => {
      this.debug(`📡 API ${method} ${url}`, {
        action: 'api_request',
        method,
        url,
        ...context
      })
    },

    response: (method: string, url: string, status: number, context?: Partial<LogContext>) => {
      const level = status >= 400 ? LogLevel.WARN : LogLevel.DEBUG
      const message = `📡 API ${method} ${url} - ${status}`
      
      if (level === LogLevel.WARN) {
        this.warn(message, {
          action: 'api_response',
          method,
          url,
          status,
          ...context
        })
      } else {
        this.debug(message, {
          action: 'api_response',
          method,
          url,
          status,
          ...context
        })
      }
    },

    error: (method: string, url: string, error: Error, context?: Partial<LogContext>) => {
      this.error(`📡 API ${method} ${url} failed`, error, {
        action: 'api_error',
        method,
        url,
        ...context
      })
    }
  }

  // 🎯 Performance logging
  performance = {
    start: (operation: string, context?: Partial<LogContext>) => {
      this.debug(`⏱️ ${operation} started`, {
        action: 'performance_start',
        operation,
        ...context
      })
    },

    end: (operation: string, duration: number, context?: Partial<LogContext>) => {
      this.debug(`⏱️ ${operation} completed in ${duration}ms`, {
        action: 'performance_end',
        operation,
        duration,
        ...context
      })
    },

    slow: (operation: string, duration: number, threshold: number = 1000, context?: Partial<LogContext>) => {
      if (duration > threshold) {
        this.warn(`🐌 ${operation} took ${duration}ms (threshold: ${threshold}ms)`, {
          action: 'performance_slow',
          operation,
          duration,
          threshold,
          ...context
        })
      }
    }
  }

  // 🎯 Component logging
  component = {
    mount: (componentName: string, context?: Partial<LogContext>) => {
      this.debug(`🎯 ${componentName} mounted`, {
        action: 'component_mount',
        component: componentName,
        ...context
      })
    },

    unmount: (componentName: string, context?: Partial<LogContext>) => {
      this.debug(`🎯 ${componentName} unmounted`, {
        action: 'component_unmount',
        component: componentName,
        ...context
      })
    },

    render: (componentName: string, context?: Partial<LogContext>) => {
      this.debug(`🎯 ${componentName} rendered`, {
        action: 'component_render',
        component: componentName,
        ...context
      })
    },

    error: (componentName: string, error: Error, context?: Partial<LogContext>) => {
      this.error(`🎯 ${componentName} error`, error, {
        action: 'component_error',
        component: componentName,
        ...context
      })
    }
  }
}

// 🎯 Export singleton instance
export const logger = new Logger()

// 🎯 Export convenience functions
export const log = {
  debug: (message: string, context?: Partial<LogContext>) => logger.debug(message, context),
  info: (message: string, context?: Partial<LogContext>) => logger.info(message, context),
  warn: (message: string, context?: Partial<LogContext>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Partial<LogContext>) => logger.error(message, error, context),
  auth: logger.auth,
  api: logger.api,
  performance: logger.performance,
  component: logger.component
}

// 🎯 Performance measurement utility
export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Partial<LogContext>
): Promise<T> => {
  const start = performance.now()
  logger.performance.start(operation, context)
  
  try {
    const result = await fn()
    const duration = performance.now() - start
    logger.performance.end(operation, duration, context)
    logger.performance.slow(operation, duration, 1000, context)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`${operation} failed after ${duration}ms`, error as Error, context)
    throw error
  }
}

// 🎯 Sync performance measurement
export const measurePerformanceSync = <T>(
  operation: string,
  fn: () => T,
  context?: Partial<LogContext>
): T => {
  const start = performance.now()
  logger.performance.start(operation, context)
  
  try {
    const result = fn()
    const duration = performance.now() - start
    logger.performance.end(operation, duration, context)
    logger.performance.slow(operation, duration, 1000, context)
    return result
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`${operation} failed after ${duration}ms`, error as Error, context)
    throw error
  }
} 