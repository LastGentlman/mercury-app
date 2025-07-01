import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { testAPIConnection, testRegistration, testLogin, testRegistrationErrorHandling } from '../utils/apiTest'
import { Loader2, CheckCircle, XCircle, Server, Database, Globe } from 'lucide-react'

export const Route = createFileRoute('/api-test')({
  component: APITestPage,
})

function APITestPage() {
  const [isTesting, setIsTesting] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [backendStatus, setBackendStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown')

  const runAPITests = async () => {
    setIsTesting(true)
    setResults([])
    
    // Capture console.log output
    const originalLog = console.log
    const originalError = console.error
    const logs: any[] = []
    
    console.log = (...args) => {
      logs.push({ type: 'log', args })
      originalLog(...args)
    }
    
    console.error = (...args) => {
      logs.push({ type: 'error', args })
      originalError(...args)
    }

    try {
      // Test basic API connection
      await testAPIConnection()
      
      // Test registration
      const regResult = await testRegistration()
      
      // Test login (if registration was successful)
      if (regResult.success) {
        await testLogin()
      }
      
      setResults(logs)
      setBackendStatus('connected')
    } catch (error) {
      console.error('Test failed:', error)
      setBackendStatus('disconnected')
    } finally {
      // Restore console functions
      console.log = originalLog
      console.error = originalError
      setIsTesting(false)
    }
  }

  const handleTestRegistration = async () => {
    console.log('🧪 Starting registration test...')
    const result = await testRegistration()
    console.log('📊 Registration test result:', result)
  }

  const handleTestErrorHandling = async () => {
    console.log('🧪 Starting error handling test...')
    const result = await testRegistrationErrorHandling()
    console.log('📊 Error handling test result:', result)
  }

  const getStatusIcon = () => {
    switch (backendStatus) {
      case 'connected':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'disconnected':
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Server className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusText = () => {
    switch (backendStatus) {
      case 'connected':
        return 'Backend Connected'
      case 'disconnected':
        return 'Backend Disconnected'
      default:
        return 'Status Unknown'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            API Connection Test
          </h1>
          <p className="text-gray-600">
            Test the connection between frontend and backend services.
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {getStatusIcon()}
              <span>Backend Status</span>
            </CardTitle>
            <CardDescription>
              Current connection status to the backend server
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">{getStatusText()}</p>
                <p className="text-sm text-gray-500">
                  Backend URL: http://localhost:3030
                </p>
              </div>
              <Button
                onClick={runAPITests}
                disabled={isTesting}
                className="flex items-center space-x-2"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    <span>Run Tests</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Test Results</span>
              </CardTitle>
              <CardDescription>
                Detailed results from API connection tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      log.type === 'error' 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {log.type === 'error' ? (
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <pre className="text-sm whitespace-pre-wrap">
                          {log.args.map((arg: any, i: number) => 
                            typeof arg === 'object' 
                              ? JSON.stringify(arg, null, 2)
                              : String(arg)
                          ).join(' ')}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
            <CardDescription>
              Steps to test the API connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  1
                </div>
                <div>
                  <p className="font-medium">Start the Backend</p>
                  <p className="text-sm text-gray-600">
                    Make sure the backend is running on port 3030
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  2
                </div>
                <div>
                  <p className="font-medium">Click "Run Tests"</p>
                  <p className="text-sm text-gray-600">
                    This will test all API endpoints and show results
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                  3
                </div>
                <div>
                  <p className="font-medium">Check Results</p>
                  <p className="text-sm text-gray-600">
                    Green checkmarks indicate successful connections
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Registration</CardTitle>
              <CardDescription>
                Test the basic registration endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestRegistration} className="w-full">
                Run Registration Test
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                Check the browser console for detailed results
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Error Handling</CardTitle>
              <CardDescription>
                Test registration error handling with duplicate emails
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleTestErrorHandling} className="w-full">
                Run Error Handling Test
              </Button>
              <p className="text-sm text-gray-600 mt-2">
                This will test duplicate email registration to see error responses
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Open the browser's Developer Tools (F12)</li>
                <li>Go to the Console tab</li>
                <li>Click the test buttons above</li>
                <li>Check the console output for detailed information about the API responses</li>
                <li>Look for any error messages or unexpected response formats</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 