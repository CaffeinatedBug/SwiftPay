'use client'

import { WalletButton, WalletStatus, ChainSwitcher, ConnectionIndicator } from '@/components/wallet/WalletButton'
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
              {/* Balance summary */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Balance:</span>
                <span className="font-mono font-medium">
                  {parseFloat(wallet.nativeBalance.formatted).toFixed(4)} {wallet.nativeBalance.symbol}
                </span>
              </div>

              {/* Quick refresh */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickRefresh}
                disabled={isRefreshing || wallet.nativeBalance.isLoading}
                className="p-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Chain switcher */}
              <ChainSwitcher />

              {/* Wallet status dropdown */}
              <WalletStatus />
            </>
          )}

          {/* Connect wallet button */}
          {!wallet.isConnected && (
            <WalletButton variant="default" size="default" />
          )}

          {/* Settings (placeholder for future features) */}
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Optional secondary bar for additional info */}
      {wallet.isConnected && wallet.currentChainTokens.length > 0 && (
        <div className="border-t bg-muted/30 px-6 py-2">
          <div className="flex items-center gap-4 overflow-x-auto">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              Token Balances:
            </span>
            
            {wallet.currentChainTokens.slice(0, 4).map((tokenBalance) => (
              <div key={tokenBalance.token.symbol} className="flex items-center gap-1 text-xs whitespace-nowrap">
                <span className="font-medium">{tokenBalance.token.symbol}:</span>
                <span className="font-mono">
                  {tokenBalance.isLoading ? '•••' : parseFloat(tokenBalance.formatted).toFixed(4)}
                </span>
              </div>
            ))}
            
            {wallet.currentChainTokens.length > 4 && (
              <span className="text-xs text-muted-foreground">
                +{wallet.currentChainTokens.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </header>
  )
}