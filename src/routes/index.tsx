import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { ArrowRight, Package, ShoppingCart, TrendingUp } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { useAuth } from '../hooks/useAuth'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: '/dashboard' })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to <span className="text-blue-600">PedidoList</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The ultimate order management system for businesses. 
            Streamline your operations, track orders, and boost productivity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => navigate({ to: '/auth' })}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
              onClick={() => navigate({ to: '/auth' })}
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>
                Create, track, and manage orders with ease
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Streamline your order processing workflow with our intuitive interface.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Inventory Tracking</CardTitle>
              <CardDescription>
                Keep track of your inventory in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Monitor stock levels and get alerts when items are running low.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Get insights into your business performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Detailed reports and analytics to help you make informed decisions.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription>
                Join thousands of businesses already using PedidoList
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => navigate({ to: '/auth' })}
              >
                Create Your Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
