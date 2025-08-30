import { createFileRoute } from '@tanstack/react-router'
import { OptimizedAuthCallback } from '../components/OptimizedAuthCallback.tsx'

export const Route = createFileRoute('/auth/callback')({
  component: AuthCallbackPage,
})

export default function AuthCallbackPage() {
  return <OptimizedAuthCallback />
} 