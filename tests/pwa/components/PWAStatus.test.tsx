import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAStatus } from '../../../src/components/PWAStatus'

// Mock PWA utilities
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn()
}))

describe('PWAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render PWA status when running as PWA', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByText(/pwa/i)).toBeInTheDocument()
    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  it('should render browser status when running in browser', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(false)
    getPWALaunchMethod.mockReturnValue('browser')

    render(<PWAStatus />)
    
    expect(screen.getByText(/browser/i)).toBeInTheDocument()
  })

  it('should show correct launch method', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    expect(screen.getByText(/installed/i)).toBeInTheDocument()
  })

  it('should handle unknown launch method', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(false)
    getPWALaunchMethod.mockReturnValue('unknown')

    render(<PWAStatus />)
    
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
  })

  it('should apply correct CSS classes for PWA status', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByText(/pwa/i)
    expect(statusElement).toHaveClass('pwa-status')
  })

  it('should apply correct CSS classes for browser status', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(false)
    getPWALaunchMethod.mockReturnValue('browser')

    render(<PWAStatus />)
    
    const statusElement = screen.getByText(/browser/i)
    expect(statusElement).toHaveClass('pwa-status')
  })

  it('should have correct accessibility attributes', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByText(/pwa/i)
    expect(statusElement).toHaveAttribute('aria-label')
  })

  it('should display status icon when provided', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    // Check if icon is present (assuming it uses an icon component)
    const iconElement = screen.getByTestId('pwa-status-icon')
    expect(iconElement).toBeInTheDocument()
  })

  it('should handle different display modes', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    
    // Test standalone mode
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    const { rerender } = render(<PWAStatus />)
    expect(screen.getByText(/installed/i)).toBeInTheDocument()

    // Test browser mode
    isPWAInstalled.mockReturnValue(false)
    getPWALaunchMethod.mockReturnValue('browser')

    rerender(<PWAStatus />)
    expect(screen.getByText(/browser/i)).toBeInTheDocument()
  })

  it('should be responsive and mobile-friendly', () => {
    const { isPWAInstalled, getPWALaunchMethod } = require('../../../src/pwa')
    isPWAInstalled.mockReturnValue(true)
    getPWALaunchMethod.mockReturnValue('installed')

    render(<PWAStatus />)
    
    const statusElement = screen.getByText(/pwa/i)
    expect(statusElement).toHaveClass('responsive')
  })
}) 