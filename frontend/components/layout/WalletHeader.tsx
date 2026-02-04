'use client'

import { WalletButton, WalletStatus, ChainSwitcher, ConnectionIndicator } from '@/components/wallet/WalletButton'
import { UserProfileDropdown } from './UserProfileDropdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Network,
  Zap,
  RefreshCw,
  Settings,
  Bell
} from 'lucide-react'
import { useWallet } from '@/lib/web3/hooks'
import { useState } from 'react'

export function WalletHeader() {
  const wallet = useWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleQuickRefresh = async () => {
    setIsRefreshing(true)
    try {
      await wallet.nativeBalance.refetch()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Connection status */}
        <div className="flex items-center gap-4">
          <ConnectionIndicator />
          
          {wallet.isConnected && wallet.currentChain && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Zap className="mr-1 h-2 w-2" />
                {wallet.currentChain.name}
              </Badge>
              
              {/* Network health indicator */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Live</span>
              </div>
            </div>
          )}
        </div>

        {/* Right side - Wallet controls */}
        <div className="flex items-center gap-3">
          {wallet.isConnected && (
            <>
              {/* User Profile Dropdown */}
              <UserProfileDropdown />
            </>
          )}

          {/* Connect wallet button */}
          {!wallet.isConnected && (
            <WalletButton variant="default" size="default" />
          )}
        </div>
      </div>
    </header>
  )
}