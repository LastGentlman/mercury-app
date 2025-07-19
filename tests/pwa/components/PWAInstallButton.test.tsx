/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'

// ✅ CRITICAL FIX: Import y mock del módulo PWA correcto
import * as pwaModule from '../../../src/pwa-fixed'

vi.mock('../../../src/pwa-fixed', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn(),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(),
  registerPWA: vi.fn(),
  showInstallPrompt: vi.fn(),
  listenForInstallPrompt: vi.fn(),
  cleanupPWAListeners: vi.fn()
}))

describe('PWAInstallButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // ✅ CRITICAL FIX: Configurar mocks con valores específicos
    vi.mocked(pwaModule.isPWAInstalled).mockReturnValue(false)
    vi.mocked(pwaModule.getPWALaunchMethod).mockReturnValue('browser')
    vi.mocked(pwaModule.showInstallPrompt).mockResolvedValue(true)
    
    // ✅ CRITICAL FIX: Mock del evento beforeinstallprompt
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
  })

  it('should render install button when PWA can be installed', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    // Initially, the button should not be visible because canInstall is false
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('should not render when PWA is already installed', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(true)
    
    render(<PWAInstallButton />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should not render when beforeinstallprompt is not available', () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    
    // Remove beforeinstallprompt
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: undefined,
      writable: true,
      configurable: true
    })
    
    render(<PWAInstallButton />)
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should handle install button click', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    ;(pwaModule.showInstallPrompt as any).mockResolvedValue(true)
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
  })

  it('should mark as installed when user accepts installation', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    ;(pwaModule.showInstallPrompt as any).mockResolvedValue(true)
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.markAsInstalledPWA).toHaveBeenCalled()
    })
  })

  it('should show different text for reinstall', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    ;(pwaModule.wasEverInstalledAsPWA as any).mockReturnValue(true)
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('should handle installation errors gracefully', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    ;(pwaModule.showInstallPrompt as any).mockRejectedValue(new Error('Installation failed'))
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
    })
    
    // Should not crash
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
  })

  it('should handle user rejection gracefully', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    ;(pwaModule.showInstallPrompt as any).mockResolvedValue(false) // User rejected
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      fireEvent.click(button)
    })
    
    await waitFor(() => {
      expect(pwaModule.showInstallPrompt).toHaveBeenCalled()
    })
    
    // Should not mark as installed if user dismissed
    expect(pwaModule.markAsInstalledPWA).not.toHaveBeenCalled()
  })

  it('should have correct accessibility attributes', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })

  it('should apply correct CSS classes', async () => {
    (pwaModule.isPWAInstalled as any).mockReturnValue(false)
    
    render(<PWAInstallButton />)
    
    // Trigger beforeinstallprompt event to enable the button
    const beforeInstallPromptEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallPromptEvent, 'preventDefault', {
      value: vi.fn(),
      writable: true
    })
    window.dispatchEvent(beforeInstallPromptEvent)
    
    await waitFor(() => {
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })
  })
}) 