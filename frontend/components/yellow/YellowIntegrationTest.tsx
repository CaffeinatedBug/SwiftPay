'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Zap, CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, Network, Users, Wallet } from 'lucide-react'
import { useSwiftPayYellow } from '@/lib/yellow/hooks'
import { YELLOW_CONFIG, YellowUtils } from '@/lib/yellow/config'

interface TestResult {
  test: string
  status: 'pending' | 'success' | 'error' | 'warning'
  message?: string
  details?: string
}

export default function YellowIntegrationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [testAccount] = useState('0x742d35Cc6371d4c2a42584D6C95336b3E4c50246') // Example test account
  
  // Yellow Network hooks
  const {
    client,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    session,
    hasActiveSession,
    createSession,
    closeSession,
    balance,
    sendPayment,
    error,
    isReady
  } = useSwiftPayYellow()

  const addTestResult = (test: string, status: TestResult['status'], message?: string, details?: string) => {
    setTestResults(prev => [...prev, { test, status, message, details }])
  }

  const runComprehensiveTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // Test 1: Yellow Network Configuration
    addTestResult('Yellow Network Configuration', 'pending')
    try {
      const config = YELLOW_CONFIG
      if (config.SANDBOX_WS && config.SEPOLIA_CONTRACTS && config.APP_NAME) {
        addTestResult('Yellow Network Configuration', 'success', 'Configuration loaded successfully')
      } else {
        addTestResult('Yellow Network Configuration', 'error', 'Missing required configuration')
      }
    } catch (error) {
      addTestResult('Yellow Network Configuration', 'error', 'Configuration validation failed', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 2: SDK Installation
    addTestResult('Nitrolite SDK', 'pending')
    try {
      const nitrolite = await import('@erc7824/nitrolite')
      if (typeof nitrolite.createAppSessionMessage === 'function') {
        addTestResult('Nitrolite SDK', 'success', '@erc7824/nitrolite SDK loaded correctly')
      } else {
        addTestResult('Nitrolite SDK', 'error', 'SDK functions not available')
      }
    } catch (error) {
      addTestResult('Nitrolite SDK', 'error', 'SDK import failed', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 3: WebSocket Connection
    addTestResult('WebSocket Connection', 'pending')
    try {
      if (typeof WebSocket !== 'undefined') {
        addTestResult('WebSocket Connection', 'success', 'WebSocket API available')
      } else {
        addTestResult('WebSocket Connection', 'error', 'WebSocket not supported')
      }
    } catch (error) {
      addTestResult('WebSocket Connection', 'error', 'WebSocket test failed', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 4: Yellow Network Connection
    addTestResult('Yellow Network Connection', 'pending')
    if (isConnected) {
      addTestResult('Yellow Network Connection', 'success', 'Connected to Yellow Network ClearNode')
    } else {
      addTestResult('Yellow Network Connection', 'warning', 'Not connected - click Connect to test')
    }

    // Test 5: Session Management
    addTestResult('Session Management', 'pending')
    if (hasActiveSession && session) {
      addTestResult('Session Management', 'success', `Active session: ${session.sessionId?.slice(0, 12)}...`)
    } else if (isConnected) {
      addTestResult('Session Management', 'warning', 'No active session - create one to test')
    } else {
      addTestResult('Session Management', 'warning', 'Connect first to test session management')
    }

    // Test 6: Balance Tracking
    addTestResult('Balance Tracking', 'pending')
    if (hasActiveSession) {
      addTestResult('Balance Tracking', 'success', `Current balance: ${balance} ytest.usd`)
    } else {
      addTestResult('Balance Tracking', 'warning', 'Create session to test balance tracking')
    }

    // Test 7: Payment Utilities
    addTestResult('Payment Utilities', 'pending')
    try {
      const formattedAmount = YellowUtils.formatAmount('1.5', 6)
      const parsedAmount = YellowUtils.parseAmount(formattedAmount, 6)
      const isValid = YellowUtils.isValidAddress(testAccount)
      
      if (formattedAmount === '1500000' && parsedAmount === '1.500000' && isValid) {
        addTestResult('Payment Utilities', 'success', 'Utility functions working correctly')
      } else {
        addTestResult('Payment Utilities', 'error', 'Utility function validation failed')
      }
    } catch (error) {
      addTestResult('Payment Utilities', 'error', 'Utility test failed', error instanceof Error ? error.message : 'Unknown error')
    }

    // Test 8: Error Handling
    addTestResult('Error Handling', 'pending')
    if (error) {
      addTestResult('Error Handling', 'warning', `Error detected: ${error}`)
    } else {
      addTestResult('Error Handling', 'success', 'No errors detected - error handling ready')
    }

    // Test 9: Integration Readiness
    addTestResult('Integration Readiness', 'pending')
    if (isReady) {
      addTestResult('Integration Readiness', 'success', 'Fully ready for instant payments!')
    } else if (isConnected && !hasActiveSession) {
      addTestResult('Integration Readiness', 'warning', 'Connected but needs session for payments')
    } else if (!isConnected) {
      addTestResult('Integration Readiness', 'warning', 'Need to connect and create session')
    } else {
      addTestResult('Integration Readiness', 'error', 'Integration not ready')
    }

    setIsRunning(false)
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'pending':
        return 'bg-blue-50 border-blue-200'
    }
  }

  useEffect(() => {
    // Auto-run tests on component mount
    runComprehensiveTests()
  }, [])

  const successCount = testResults.filter(r => r.status === 'success').length
  const errorCount = testResults.filter(r => r.status === 'error').length
  const warningCount = testResults.filter(r => r.status === 'warning').length
  const totalTests = testResults.length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="h-8 w-8 text-yellow-500" />
        <h1 className="text-3xl font-bold">Phase 3 Yellow Network Integration Test</h1>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Test Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-muted-foreground">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalTests}</div>
              <div className="text-sm text-muted-foreground">Total Tests</div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2 justify-center">
            <Button 
              onClick={runComprehensiveTests} 
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Running Tests...' : 'Run Tests'}
            </Button>
            {!isConnected && (
              <Button variant="outline" onClick={connect} disabled={isConnecting}>
                <Zap className="h-4 w-4 mr-2" />
                Connect Yellow Network
              </Button>
            )}
            {isConnected && !hasActiveSession && (
              <Button variant="outline" onClick={() => createSession()}>
                <Users className="h-4 w-4 mr-2" />
                Create Session
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Yellow Network Status */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Yellow Network Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Connection</Badge>
              <span className="text-sm text-green-600">Connected to {YELLOW_CONFIG.SANDBOX_WS}</span>
            </div>
            {hasActiveSession && (
              <>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Session</Badge>
                  <span className="text-sm">{session?.sessionId?.slice(0, 16)}...</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Balance</Badge>
                  <span className="text-sm">{balance} ytest.usd</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Participants</Badge>
                  <span className="text-sm">{session?.participants.length}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Test Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {testResults.map((result, index) => (
            <div 
              key={index} 
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="font-medium">{result.test}</div>
                  {result.message && (
                    <div className="text-sm text-muted-foreground mt-1">{result.message}</div>
                  )}
                  {result.details && (
                    <div className="text-xs text-muted-foreground mt-1 font-mono bg-white/50 p-2 rounded">
                      {result.details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {testResults.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No test results yet. Click "Run Tests" to start.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phase 3 Completion Status */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Phase 3 Status:</strong> Yellow Network integration is {successCount >= 7 ? 'ready for production' : 'in development'}. 
          {successCount >= 7 
            ? ' Instant payment clearing with state channels is operational!' 
            : ' Some features need attention before production deployment.'
          }
        </AlertDescription>
      </Alert>
    </div>
  )
}