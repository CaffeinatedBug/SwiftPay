import WalletIntegrationTest from '@/components/WalletIntegrationTest'
import YellowIntegrationTest from '@/components/yellow/YellowIntegrationTest'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-cyan-50 to-yellow-50">
      <div className="p-6">
        <Tabs defaultValue="wallet" className="w-full">
          <div className="flex justify-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="wallet">Phase 2 - Wallet</TabsTrigger>
              <TabsTrigger value="yellow">Phase 3 - Yellow Network</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="wallet">
            <WalletIntegrationTest />
          </TabsContent>
          
          <TabsContent value="yellow">
            <YellowIntegrationTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}