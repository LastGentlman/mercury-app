import { useState, useCallback } from 'react'

export type OAuthProvider = 'google' | 'facebook'

export interface OAuthModalState {
  isOpen: boolean
  provider: OAuthProvider | null
  step: 'confirm' | 'redirecting' | 'error'
  error: string | undefined
}

export const useOAuthModal = () => {
  const [state, setState] = useState<OAuthModalState>({
    isOpen: false,
    provider: null,
    step: 'confirm',
    error: undefined
  })

  const openModal = useCallback((provider: OAuthProvider) => {
    setState({
      isOpen: true,
      provider,
      step: 'confirm',
      error: undefined
    })
  }, [])

  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      provider: null,
      step: 'confirm',
      error: undefined
    })
  }, [])

  const setStep = useCallback((step: OAuthModalState['step'], error?: string) => {
    setState(prev => ({
      ...prev,
      step,
      error
    }))
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      step: 'error',
      error
    }))
  }, [])

  return {
    ...state,
    openModal,
    closeModal,
    setStep,
    setError
  }
} 