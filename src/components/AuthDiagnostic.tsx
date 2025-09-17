/**
 * Authentication Diagnostic Component
 * 
 * Provides comprehensive debugging information for authentication issues
 * and infinite redirect loops
 */

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth.ts'
import { supabase } from '../utils/supabase.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card.tsx'
import { Button } from './ui/button.tsx'
import { Badge } from './ui/badge.tsx'
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface DiagnosticData {
  timestamp: string
  hasSession: boolean
  hasUser: boolean
  userEmail?: string | undefined
  userId?: string | undefined
  tokenExpiry?: string | undefined
  currentPath: string
  isAuthenticated: boolean
  isLoading: boolean
  redirectAttempts: number
  validationResult?: any
  supabaseSession?: any
  localStorageData?: any
  sessionStorageData?: any
}

export function AuthDiagnostic() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const { isAuthenticated, isLoading } = useAuth()

  const runDiagnostics = async () => {
    setIsRunning(true)
    
    try {
      console.log('🔍 Running comprehensive authentication diagnostics...')
      
      // Get Supabase session
      const { data: session } = await supabase?.auth.getSession() || { data: null }
      
      // Get current user
      const { data: { user: currentUser } } = await supabase?.auth.getUser() || { data: { user: null } }
      
      // Get redirect manager data
      const redirectCount = (window as any).redirectManager?.getRedirectCount?.() || 0
      
      // Get localStorage data
      const authToken = localStorage.getItem('authToken')
      const localStorageData = {
        authToken: authToken ? `${authToken.substring(0, 20)}...` : null,
        hasAuthToken: !!authToken
      }
      
      // Get sessionStorage data
      const sessionStorageData = {
        keys: Object.keys(sessionStorage),
        hasData: Object.keys(sessionStorage).length > 0
      }
      
      // Validate account if user exists
      let validationResult = null
      if (currentUser) {
        try {
          // Import the validation service
          const { AccountDeletionService } = await import('../services/account-deletion-service.ts')
          const deletionStatus = await AccountDeletionService.checkAccountDeletionStatus(currentUser.id)
          validationResult = {
            isDeleted: deletionStatus.isDeleted,
            isInGracePeriod: deletionStatus.isInGracePeriod,
            canCancel: deletionStatus.canCancel
          }
        } catch (error) {
          validationResult = { error: 'Failed to validate account' }
        }
      }
      
      const diagnosticData: DiagnosticData = {
        timestamp: new Date().toISOString(),
        hasSession: !!session?.session,
        hasUser: !!currentUser,
        userEmail: currentUser?.email,
        userId: currentUser?.id,
        tokenExpiry: session?.session?.expires_at ? new Date(session.session.expires_at * 1000).toISOString() : undefined,
        currentPath: globalThis.location?.pathname || '/',
        isAuthenticated,
        isLoading,
        redirectAttempts: redirectCount,
        validationResult,
        supabaseSession: session?.session ? {
          access_token: session.session.access_token ? `${session.session.access_token.substring(0, 20)}...` : null,
          expires_at: session.session.expires_at,
          user_id: session.session.user?.id
        } : null,
        localStorageData,
        sessionStorageData
      }
      
      setDiagnostics(diagnosticData)
      console.log('✅ Diagnostics completed:', diagnosticData)
      
    } catch (error) {
      console.error('❌ Diagnostic error:', error)
      setDiagnostics({
        timestamp: new Date().toISOString(),
        hasSession: false,
        hasUser: false,
        currentPath: globalThis.location?.pathname || '/',
        isAuthenticated: false,
        isLoading: false,
        redirectAttempts: 0,
        validationResult: { error: 'Diagnostic failed' }
      })
    } finally {
      setIsRunning(false)
    }
  }

  const clearAuthData = () => {
    localStorage.clear()
    sessionStorage.clear()
    if (supabase) {
      supabase.auth.signOut()
    }
    window.location.reload()
  }

  const forceRedirectToDashboard = () => {
    window.location.replace('/dashboard')
  }

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"}>
        {condition ? trueText : falseText}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          Authentication Diagnostic Panel
        </CardTitle>
        <CardDescription>
          Comprehensive debugging information for authentication issues and infinite redirect loops
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Diagnostics'}
          </Button>
          
          <Button 
            onClick={clearAuthData} 
            variant="destructive"
            size="sm"
          >
            Clear Auth Data
          </Button>
          
          <Button 
            onClick={forceRedirectToDashboard} 
            variant="default"
            size="sm"
          >
            Force Dashboard Redirect
          </Button>
        </div>

        {/* Diagnostic Results */}
        {diagnostics && (
          <div className="space-y-4">
            {/* Basic Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  {getStatusIcon(diagnostics.hasSession)}
                  Session Status
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Has Session:</span>
                    {getStatusBadge(diagnostics.hasSession, 'Yes', 'No')}
                  </div>
                  <div className="flex justify-between">
                    <span>Has User:</span>
                    {getStatusBadge(diagnostics.hasUser, 'Yes', 'No')}
                  </div>
                  <div className="flex justify-between">
                    <span>Is Authenticated:</span>
                    {getStatusBadge(diagnostics.isAuthenticated, 'Yes', 'No')}
                  </div>
                  <div className="flex justify-between">
                    <span>Is Loading:</span>
                    {getStatusBadge(diagnostics.isLoading, 'Yes', 'No')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  User Information
                </h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Email:</strong> {diagnostics.userEmail || 'N/A'}</div>
                  <div><strong>User ID:</strong> {diagnostics.userId || 'N/A'}</div>
                  <div><strong>Current Path:</strong> {diagnostics.currentPath}</div>
                  <div><strong>Redirect Attempts:</strong> {diagnostics.redirectAttempts}</div>
                </div>
              </div>
            </div>

            {/* Token Information */}
            {diagnostics.supabaseSession && (
              <div className="space-y-2">
                <h4 className="font-medium">Token Information</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Access Token:</strong> {diagnostics.supabaseSession.access_token || 'N/A'}</div>
                  <div><strong>Expires At:</strong> {diagnostics.tokenExpiry || 'N/A'}</div>
                  <div><strong>User ID:</strong> {diagnostics.supabaseSession.user_id || 'N/A'}</div>
                </div>
              </div>
            )}

            {/* Validation Results */}
            {diagnostics.validationResult && (
              <div className="space-y-2">
                <h4 className="font-medium">Account Validation</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {diagnostics.validationResult.error ? (
                    <div className="text-red-600">{diagnostics.validationResult.error}</div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Is Deleted:</span>
                        {getStatusBadge(!diagnostics.validationResult.isDeleted, 'No', 'Yes')}
                      </div>
                      <div className="flex justify-between">
                        <span>In Grace Period:</span>
                        {getStatusBadge(diagnostics.validationResult.isInGracePeriod, 'Yes', 'No')}
                      </div>
                      <div className="flex justify-between">
                        <span>Can Cancel:</span>
                        {getStatusBadge(diagnostics.validationResult.canCancel, 'Yes', 'No')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Storage Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Local Storage</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Has Auth Token:</strong> {diagnostics.localStorageData?.hasAuthToken ? 'Yes' : 'No'}</div>
                  <div><strong>Token Preview:</strong> {diagnostics.localStorageData?.authToken || 'N/A'}</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Session Storage</h4>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <div><strong>Has Data:</strong> {diagnostics.sessionStorageData?.hasData ? 'Yes' : 'No'}</div>
                  <div><strong>Keys:</strong> {diagnostics.sessionStorageData?.keys?.join(', ') || 'None'}</div>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <details className="space-y-2">
              <summary className="font-medium cursor-pointer">Raw Diagnostic Data</summary>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                {JSON.stringify(diagnostics, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How to Use This Diagnostic</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click "Run Diagnostics" to get current authentication state</li>
            <li>• Check if "Has Session" and "Has User" are both true but "Is Authenticated" is false</li>
            <li>• Look for high "Redirect Attempts" count indicating infinite loops</li>
            <li>• Use "Clear Auth Data" to reset authentication state</li>
            <li>• Use "Force Dashboard Redirect" to bypass validation loops</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
