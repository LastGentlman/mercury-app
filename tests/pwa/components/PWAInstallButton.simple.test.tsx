import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PWAInstallButton } from '../../../src/components/PWAInstallButton'

// Mock the entire pwa module before importing the component
vi.mock('../../../src/pwa', () => ({
  isPWAInstalled: () => false,
  getPWALaunchMethod: () => 'browser',
  markAsInstalledPWA: vi.fn(),
  wasEverInstalledAsPWA: () => false,
  showInstallPrompt: vi.fn().mockResolvedValue(true)
}))

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  Download: () => 'Download'
}))

describe('PWAInstallButton - Simple Test', () => {
  it('should render without crashing', () => {
    render(<PWAInstallButton />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
}) 