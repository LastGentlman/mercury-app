/// <reference types="vitest/globals" />
// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'
import {
  getPWALaunchMethod as _getPWALaunchMethod,
  showInstallPrompt as _showInstallPrompt,
  wasEverInstalledAsPWA as _wasEverInstalledAsPWA,
  isPWAInstalled,
  markAsInstalledPWA
} from '../../../src/pwa.ts'

vi.mock('../../../src/pwa.ts', () => ({
  isPWAInstalled: vi.fn(),
  getPWALaunchMethod: vi.fn(),
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: vi.fn(),
  showInstallPrompt: vi.fn()
}))

// Mock beforeinstallprompt event
const mockBeforeInstallPrompt = {
  prompt: vi.fn(),
  userChoice: Promise.resolve({ outcome: 'accepted' })
}

describe('PWAInstallButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window beforeinstallprompt event
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: mockBeforeInstallPrompt,
      writable: true
    })
  })

  it('should render install button when PWA can be installed', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    render(<PWAInstallButton />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText(/install/i)).toBeInTheDocument()
  })

  it('should not render when PWA is already installed', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(true)
    render(<PWAInstallButton />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should not render when beforeinstallprompt is not available', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    // Remove beforeinstallprompt
    Object.defineProperty(window, 'beforeinstallprompt', {
      value: undefined,
      writable: true
    })
    render(<PWAInstallButton />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should handle install button click', async () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled()
    })
  })

  it('should mark as installed when user accepts installation', async () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(vi.mocked(markAsInstalledPWA)).toHaveBeenCalled()
    })
  })

  it('should show different text for reinstall', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    vi.mocked(_wasEverInstalledAsPWA).mockReturnValue(true)
    render(<PWAInstallButton />)
    expect(screen.getByText(/reinstall/i)).toBeInTheDocument()
  })

  it('should handle installation errors gracefully', async () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    // Mock prompt to throw error
    mockBeforeInstallPrompt.prompt.mockRejectedValue(new Error('Installation failed'))
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    // Should not crash
    await waitFor(() => {
      expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled()
    })
  })

  it('should handle user rejection gracefully', async () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    // Mock user rejection
    mockBeforeInstallPrompt.userChoice = Promise.resolve({ outcome: 'dismissed' })
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    await waitFor(() => {
      expect(mockBeforeInstallPrompt.prompt).toHaveBeenCalled()
    })
    // Should not mark as installed if user dismissed
    expect(vi.mocked(markAsInstalledPWA)).not.toHaveBeenCalled()
  })

  it('should have correct accessibility attributes', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title')
  })

  it('should apply correct CSS classes', () => {
    vi.mocked(isPWAInstalled).mockReturnValue(false)
    render(<PWAInstallButton />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-blue-600')
    expect(button).toHaveClass('hover:bg-blue-700')
  })
}) 