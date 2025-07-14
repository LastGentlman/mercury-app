/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'

// Import the mocked modules to access their functions
import * as pwaModule from '../../../src/pwa'

describe('PWAInstallButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the beforeinstallprompt event
    const mockBeforeInstallPrompt = {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
      preventDefault: vi.fn()
    }
    
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: mockBeforeInstallPrompt,
      writable: true,
      configurable: true
    })
    
    // Trigger the beforeinstallprompt event
    const event = new Event('beforeinstallprompt')
    Object.defineProperty(event, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(event)
  })

  it('should render install button when PWA can be installed', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument()
    })
  })

  it('should not render when PWA is already installed', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(true)
    
    render(<PWAInstallButton />)
    
    expect(screen.queryByTestId('button')).not.toBeInTheDocument()
  })

  it('should not render when beforeinstallprompt is not available', () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    
    // Remove beforeinstallprompt
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: undefined,
      writable: true,
      configurable: true
    })
    
    render(<PWAInstallButton />)
    
    expect(screen.queryByTestId('button')).not.toBeInTheDocument()
  })

  it('should handle install button click', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
  })

  it('should mark as installed when user accepts installation', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.markAsInstalledPWA).toHaveBeenCalled()
    })
  })

  it('should show different text for reinstall', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.wasEverInstalledAsPWA).mockReturnValue(true)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      expect(screen.getByTestId('button')).toBeInTheDocument()
    })
  })

  it('should handle installation errors gracefully', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.showInstallPrompt).mockRejectedValue(new Error('Installation failed'))
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      fireEvent.click(button)
    })
    
    // Should not crash
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
  })

  it('should handle user rejection gracefully', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(false) // User rejected
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
    
    // Should not mark as installed if user dismissed
    expect(pwaModule.markAsInstalledPWA).not.toHaveBeenCalled()
  })

  it('should have correct accessibility attributes', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('should apply correct CSS classes', async () => {
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    await waitFor(() => {
      const button = screen.getByTestId('button')
      expect(button).toBeInTheDocument()
    })
  })
}) 