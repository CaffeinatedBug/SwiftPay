'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Send,
  Wallet,
  Network,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react'
import { useSwiftPayYellow } from '@/lib/yellow/hooks'
import { YellowUtils } from '@/lib/yellow/config'
import { toast } from 'sonner'

/**
 * Main Yellow Network integration panel
 */
export function YellowNetworkPanel() {
  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    session,
    hasActiveSession,
    isCreatingSession,
    createSession,
    closeSession,
    balance,
    sendPayment,
    isSendingPayment,
    paymentHistory,
    error,
    isReady,
    canSendPayments
  } = useSwiftPayYellow()

  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [partnerAddress, setPartnerAddress] = useState('')

  const handleConnect = async () => {
    try {
      await connect()
      toast.success('Connected to Yellow Network!')
    } catch (error) {
      toast.error('Failed to connect to Yellow Network')
    }
  }

  const handleCreateSession = async () => {
    try {
      await createSession(partnerAddress || undefined)
      toast.success('Payment session created!')
    } catch (error) {
      toast.error('Failed to create session')
    }
  }

  const handleSendPayment = async () => {
    if (!recipient || !amount) {
      toast.error('Please enter recipient address and amount')
      return
    }

    if (!YellowUtils.isValidAddress(recipient)) {
      toast.error('Invalid recipient address')
      return
    }

    const success = await sendPayment(amount, recipient)
    if (success) {
      toast.success(`Sent ${amount} tokens instantly!`)
      setAmount('')
      setRecipient('')
    } else {
      toast.error('Payment failed')
    }
  }

  const handleCloseSession = async () => {
    try {
      await closeSession()
      toast.success('Session closed and settled on-chain')
    } catch (error) {
      toast.error('Failed to close session')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Zap className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Yellow Network</h2>
        <Badge variant="outline" className="text-xs">
          Instant Payment Clearing
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isConnected ? 'Connected to Yellow Network' : 'Not connected'}
              </span>
            </div>
            <Button 
              onClick={isConnected ? disconnect : handleConnect}
              disabled={isConnecting}
              size="sm"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : isConnected ? (
                'Disconnect'
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Management */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payment Session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasActiveSession ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partner">Partner Address (Optional)</Label>
                  <Input
                    id="partner"
                    placeholder="0x... (leave empty for solo session)"
                    value={partnerAddress}
                    onChange={(e) => setPartnerAddress(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleCreateSession}
                  disabled={isCreatingSession}
                  className="w-full"
                >
                  {isCreatingSession ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Session...
                    </>
                  ) : (
                    'Create Payment Session'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Active Session</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {session?.sessionId?.slice(0, 12)}...
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Participants: {session?.participants.length}
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Active
                  </Badge>
                </div>
                <Button 
                  onClick={handleCloseSession}
                  variant="outline"
                  className="w-full"
                >
                  Close Session & Settle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Balance & Payments */}
      {hasActiveSession && (
        <>
          {/* Balance Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Session Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center">
                {balance} <span className="text-lg font-normal text-muted-foreground">ytest.usd</span>
              </div>
            </CardContent>
          </Card>

          {/* Send Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Instant Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Address</Label>
                <Input
                  id="recipient"
                  placeholder="0x..."
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (ytest.usd)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendPayment}
                disabled={!canSendPayments || !recipient || !amount}
                className="w-full"
              >
                {isSendingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Send Instantly
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

/**
 * Compact Yellow Network status widget
 */
export function YellowStatusWidget() {
  const { isConnected, hasActiveSession, balance, isReady } = useSwiftPayYellow()

  if (!isConnected) return null

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Yellow Network</span>
          </div>
          <Badge variant={isReady ? "default" : "secondary"} className="text-xs">
            {isReady ? "Ready" : hasActiveSession ? "Session" : "Connected"}
          </Badge>
        </div>
        {hasActiveSession && (
          <div className="mt-2">
            <div className="text-lg font-bold">{balance}</div>
            <div className="text-xs text-muted-foreground">ytest.usd available</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Payment history display
 */
export function YellowPaymentHistory() {
  const { paymentHistory } = useSwiftPayYellow()

  if (paymentHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No payments yet
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {paymentHistory.slice(0, 10).map((payment, index) => (
          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {payment.type === 'sent' ? (
                <ArrowUpRight className="h-4 w-4 text-red-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-green-500" />
              )}
              <div>
                <div className="font-medium">
                  {payment.type === 'sent' ? 'Sent' : 'Received'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {payment.type === 'sent' 
                    ? `To ${payment.recipient?.slice(0, 8)}...`
                    : `From ${payment.sender?.slice(0, 8)}...`
                  }
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {payment.type === 'sent' ? '-' : '+'}{payment.amount}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(payment.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * Yellow Network notifications
 */
export function YellowNotifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useSwiftPayYellow()

  if (notifications.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all read
            </Button>
            <Button variant="ghost" size="sm" onClick={clearNotifications}>
              Clear
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notifications.slice(0, 5).map((notification) => (
          <div 
            key={notification.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              notification.read 
                ? 'bg-muted/30 border-muted' 
                : 'bg-primary/5 border-primary/20'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'payment' && <ArrowDownRight className="h-4 w-4 text-green-500" />}
              {notification.type === 'session' && <Users className="h-4 w-4 text-blue-500" />}
              {notification.type === 'funding' && <Wallet className="h-4 w-4 text-purple-500" />}
              {notification.type === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
              <span className="text-sm">{notification.message}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {new Date(notification.timestamp).toLocaleString()}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}