import { useState, useCallback } from 'react'

export type OAuthProvider = 'google' | 'facebook'

export interface OAuthModalState {
  isOpen: boolean
  provider: OAuthProvider | null
  error: string | undefined
}

export const useOAuthModal = () => {
  const [state, setState] = useState<OAuthModalState>({
    isOpen: false,
    provider: null,
    error: undefined
  })

  const openModal = useCallback((provider: OAuthProvider) => {
    setState({
      isOpen: true,
      provider,
      error: undefined
    })
  }, [])

  const closeModal = useCallback(() => {
    setState({
      isOpen: false,
      provider: null,
      error: undefined
    })
  }, [])

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      error
    }))
  }, [])

  return {
    ...state,
    openModal,
    closeModal,
    setError
  }
} 