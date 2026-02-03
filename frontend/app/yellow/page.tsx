import { YellowNetworkPanel, YellowPaymentHistory, YellowNotifications } from '@/components/yellow/YellowNetworkPanel'

export default function YellowTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Yellow Network Integration
          </h1>
          <p className="text-muted-foreground">
            Test instant payment clearing with state channels
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Yellow Network Panel */}
          <div>
            <YellowNetworkPanel />
          </div>

          {/* Payment History and Notifications */}
          <div className="space-y-6">
            <YellowPaymentHistory />
            <YellowNotifications />
          </div>
        </div>

        {/* Integration Info */}
        <div className="mt-8 p-6 bg-white/50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Phase 3: Yellow Network Integration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-yellow-700">🚀 Instant Payments</h4>
              <p className="text-muted-foreground">Sub-second transaction clearing using state channels</p>
            </div>
            <div>
              <h4 className="font-medium text-orange-700">⚡ Gas-Free Transfers</h4>
              <p className="text-muted-foreground">Off-chain operations with on-chain settlement</p>
            </div>
            <div>
              <h4 className="font-medium text-red-700">🔒 Secure Sessions</h4>
              <p className="text-muted-foreground">Cryptographic proofs and dispute resolution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}