import { env } from '../env.ts'

interface PerfAPI {
  enabled: boolean
  mark: (name: string) => void
  measure: (name: string, startMark: string, endMark?: string) => number
  timeAsync: <T>(label: string, fn: () => Promise<T>) => Promise<T>
}

function safeNow(): number {
  try {
    return performance.now()
  } catch {
    return Date.now()
  }
}

const marks = new Map<string, number>()

export const perf: PerfAPI = {
  enabled: (env.VITE_OAUTH_PERF_LOGS === 'true') || (import.meta.env?.DEV === true),

  mark(name: string) {
    if (!this.enabled) return
    marks.set(name, safeNow())
  },

  measure(name: string, startMark: string, endMark?: string): number {
    if (!this.enabled) return 0
    const start = marks.get(startMark)
    const end = endMark ? (marks.get(endMark) ?? safeNow()) : safeNow()
    if (start === undefined) return 0
    const duration = end - start
    // eslint-disable-next-line no-console
    console.log(`[PERF] ${name}: ${duration.toFixed(1)}ms`)
    return duration
  },

  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return await fn()
    const t0 = safeNow()
    try {
      const result = await fn()
      const dur = safeNow() - t0
      // eslint-disable-next-line no-console
      console.log(`[PERF] ${label}: ${dur.toFixed(1)}ms`)
      return result
    } catch (error) {
      const dur = safeNow() - t0
      // eslint-disable-next-line no-console
      console.log(`[PERF] ${label} FAILED: ${dur.toFixed(1)}ms`)
      throw error
    }
  }
} 