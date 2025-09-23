import { createFileRoute } from '@tanstack/react-router'
import AccountRecovery from '../pages/AccountRecovery'

export const Route = createFileRoute('/account-recovery')({
  component: AccountRecovery,
})