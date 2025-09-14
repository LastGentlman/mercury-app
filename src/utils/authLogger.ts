/**
 * Centralized logging for authentication
 * Follows Single Responsibility Principle
 */

interface LogContext {
  component?: string
  userId?: string
  email?: string
  provider?: string
  [key: string]: any
}

class AuthLogger {
  private isDevelopment = import.meta.env.DEV

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${level}: ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('DEBUG', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('INFO', message, context))
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('WARN', message, context))
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('ERROR', message, context))
  }

  // Specific auth logging methods
  authStateChange(event: string, context?: LogContext): void {
    this.info(`Auth state changed: ${event}`, context)
  }

  redirectAttempt(attempt: number, maxAttempts: number, context?: LogContext): void {
    this.info(`Redirect attempt ${attempt}/${maxAttempts}`, context)
  }

  oauthEvent(event: string, context?: LogContext): void {
    this.debug(`OAuth event: ${event}`, context)
  }
}

export const authLogger = new AuthLogger()
