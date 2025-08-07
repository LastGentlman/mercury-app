// Performance tracking utilities for authentication optimization
// Addresses login delay issues by providing granular performance metrics

// Network Information API types
interface NetworkInformation {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g'
  downlink: number
  rtt: number
  saveData: boolean
}

interface AuthMetrics {
  validationTime: number    // Client-side validation duration
  networkTime: number       // Server request/response time
  redirectTime: number      // Post-auth redirect time
  totalTime: number         // End-to-end authentication time
  phase: 'idle' | 'validating' | 'authenticating' | 'redirecting' | 'completed'
}

interface PerformanceThresholds {
  fast: number        // < 1000ms
  acceptable: number  // < 2000ms
  slow: number       // >= 2000ms
}

// Default performance thresholds
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  fast: 1000,
  acceptable: 2000,
  slow: 2000
}

// Performance tracker class for authentication flows
export class AuthPerformanceTracker {
  private startTime: number
  private checkpoints: Map<string, number>
  private metrics: Partial<AuthMetrics>
  private thresholds: PerformanceThresholds

  constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
    this.startTime = Date.now()
    this.checkpoints = new Map()
    this.metrics = {}
    this.thresholds = thresholds
    
    console.log('🏁 Auth performance tracking started')
  }

  // Mark a checkpoint in the auth flow
  checkpoint(phase: keyof AuthMetrics): number {
    const elapsed = Date.now() - this.startTime
    this.checkpoints.set(phase, elapsed)
    
    console.log(`⏱️ ${phase}: ${elapsed}ms`)
    return elapsed
  }

  // Track validation phase
  trackValidation(): number {
    const elapsed = this.checkpoint('validationTime')
    this.metrics.validationTime = elapsed
    return elapsed
  }

  // Track network/authentication phase
  trackAuthentication(): number {
    const elapsed = this.checkpoint('networkTime')
    this.metrics.networkTime = elapsed
    return elapsed
  }

  // Track redirect phase
  trackRedirect(): number {
    const elapsed = this.checkpoint('redirectTime')
    this.metrics.redirectTime = elapsed
    return elapsed
  }

  // Complete tracking and return final metrics
  complete(): AuthMetrics {
    const totalTime = Date.now() - this.startTime
    
    const finalMetrics: AuthMetrics = {
      validationTime: this.metrics.validationTime || 0,
      networkTime: this.metrics.networkTime || 0,
      redirectTime: this.metrics.redirectTime || 0,
      totalTime,
      phase: 'completed'
    }

    // Performance analysis
    this.analyzePerformance(finalMetrics)
    
    // Log to console for debugging
    console.log('📊 Final auth metrics:', finalMetrics)
    
    return finalMetrics
  }

  // Analyze performance and provide insights
  private analyzePerformance(metrics: AuthMetrics): void {
    const { totalTime } = metrics
    
    if (totalTime < this.thresholds.fast) {
      console.log('🚀 Fast authentication achieved!', `${totalTime}ms`)
    } else if (totalTime < this.thresholds.acceptable) {
      console.log('✅ Acceptable authentication time', `${totalTime}ms`)
    } else {
      console.log('⚠️ Slow authentication detected', `${totalTime}ms`)
      this.identifyBottlenecks(metrics)
    }
  }

  // Identify performance bottlenecks
  private identifyBottlenecks(metrics: AuthMetrics): void {
    const { validationTime, networkTime, redirectTime, totalTime } = metrics
    
    console.log('🔍 Performance bottleneck analysis:')
    
    // Calculate percentages
    const validationPercent = Math.round((validationTime / totalTime) * 100)
    const networkPercent = Math.round((networkTime / totalTime) * 100)
    const redirectPercent = Math.round((redirectTime / totalTime) * 100)
    
    console.log(`   Validation: ${validationTime}ms (${validationPercent}%)`)
    console.log(`   Network: ${networkTime}ms (${networkPercent}%)`)
    console.log(`   Redirect: ${redirectTime}ms (${redirectPercent}%)`)
    
    // Identify primary bottleneck
    if (networkTime > 1000) {
      console.log('🚨 Network bottleneck detected - check server response time')
    }
    if (validationTime > 100) {
      console.log('🚨 Validation bottleneck detected - optimize client-side validation')
    }
    if (redirectTime > 500) {
      console.log('🚨 Redirect bottleneck detected - optimize post-auth flow')
    }
  }
}

// Quick performance tracker for simple use cases
export function createQuickTracker() {
  const start = Date.now()
  
  return {
    elapsed: () => Date.now() - start,
    log: (label: string) => {
      const elapsed = Date.now() - start
      console.log(`⏱️ ${label}: ${elapsed}ms`)
      return elapsed
    }
  }
}

// Real User Monitoring (RUM) utilities
export class AuthRUMCollector {
  private static metrics: AuthMetrics[] = []
  
  // Collect metrics for analysis
  static collect(metrics: AuthMetrics): void {
    this.metrics.push(metrics)
    
    // Keep only last 100 measurements to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }
    
    // Send to monitoring service in production
    if (import.meta.env.PROD) {
      this.sendToMonitoring(metrics)
    }
  }
  
  // Get performance statistics
  static getStats() {
    if (this.metrics.length === 0) return null
    
    const totalTimes = this.metrics.map(m => m.totalTime)
    const avg = totalTimes.reduce((a, b) => a + b, 0) / totalTimes.length
    const min = Math.min(...totalTimes)
    const max = Math.max(...totalTimes)
    
    // Calculate percentiles
    const sorted = [...totalTimes].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p90 = sorted[Math.floor(sorted.length * 0.9)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    
    return {
      sampleSize: this.metrics.length,
      average: Math.round(avg),
      min,
      max,
      p50,
      p90,
      p95,
      fastLogins: this.metrics.filter(m => m.totalTime < 1000).length,
      slowLogins: this.metrics.filter(m => m.totalTime >= 2000).length
    }
  }
  
  // Send metrics to monitoring service
  private static async sendToMonitoring(metrics: AuthMetrics): Promise<void> {
    try {
      // Replace with your actual monitoring endpoint
      await fetch('/api/monitoring/auth-performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: globalThis.location.href
        })
      })
    } catch (error) {
      console.warn('Failed to send performance metrics:', error)
    }
  }
}

// Preload critical resources for faster subsequent loads
export function preloadAuthResources(): void {
  // Preload dashboard route
  if ('requestIdleCallback' in globalThis) {
    requestIdleCallback(() => {
      // Preload critical CSS
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = '/dashboard'
      document.head.appendChild(link)
      
      // Health check API to warm up connection
      fetch('/api/auth/health-check', { method: 'HEAD' }).catch(() => {
        // Ignore errors - this is just a warm-up
      })
    })
  }
}

// Performance optimization helpers
export const PerformanceHelpers = {
  // Debounce validation to avoid excessive API calls
    debounce<T extends (...args: unknown[]) => unknown>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout>
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(this, args), delay)
    }
  },

  // Throttle function for limiting API calls
  throttle<T extends (...args: unknown[]) => unknown>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // Check if user is on slow connection
  isSlowConnection(): boolean {
    const connection = (navigator as unknown as Navigator & { connection: NetworkInformation }).connection
    if (!connection) return false
    
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.downlink < 1.5
  },

  // Get network quality info
  getNetworkInfo() {
    const connection = (navigator as Navigator & { connection: NetworkInformation }).connection
    if (!connection) return null
    
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    }
  }
}

// Export performance monitoring hook
export function useAuthPerformance() {
  const tracker = new AuthPerformanceTracker()
  
  return {
    tracker,
    trackValidation: () => tracker.trackValidation(),
    trackAuthentication: () => tracker.trackAuthentication(),
    trackRedirect: () => tracker.trackRedirect(),
    complete: () => {
      const metrics = tracker.complete()
      AuthRUMCollector.collect(metrics)
      return metrics
    },
    getStats: () => AuthRUMCollector.getStats()
  }
} 