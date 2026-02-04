import WalletIntegrationTest from '@/components/WalletIntegrationTest'
import YellowIntegrationTest from '@/components/yellow/YellowIntegrationTest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Terminal, Cpu } from 'lucide-react'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl p-6">
        {/* Subtle developer header */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <Terminal className="h-5 w-5 text-gray-400" />
            <h1 className="font-mono text-xl font-semibold text-gray-600">
              Integration Test Panel
            </h1>
            <Badge variant="outline" className="border-gray-300 bg-gray-100 text-gray-600 text-xs font-mono">
              DEV_TOOLS
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-gray-400">
            Internal testing interface for wallet and network integration validation
          </p>
        </div>

        {/* Minimal tabs */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="mb-6 bg-gray-100/50 font-mono border border-gray-200">
            <TabsTrigger value="wallet" className="gap-2 font-mono text-xs data-[state=active]:bg-white">
              <Cpu className="h-3.5 w-3.5" />
              WALLET_TESTS
            </TabsTrigger>
            <TabsTrigger value="yellow" className="gap-2 font-mono text-xs data-[state=active]:bg-white">
              <Cpu className="h-3.5 w-3.5" />
              YELLOW_TESTS
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="wallet" className="border-none">
            <WalletIntegrationTest />
          </TabsContent>
          
          <TabsContent value="yellow" className="border-none">
            <YellowIntegrationTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}