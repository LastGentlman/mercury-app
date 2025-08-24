import { createFileRoute } from '@tanstack/react-router'
import { SweetAlertDemo } from '../components/SweetAlertDemo.tsx'

export const Route = createFileRoute('/sweetalert-demo')({
  component: SweetAlertDemoPage,
})

function SweetAlertDemoPage() {
  return <SweetAlertDemo />
} 