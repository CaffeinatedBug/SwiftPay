'use client'

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Copy,
  ExternalLink,
  LogOut,
  Wallet,
  Zap,
  RefreshCw,
  ChevronDown,
  Network
} from 'lucide-react'
import { useWallet } from '@/lib/web3/hooks'
import { supportedChains, chainMetadata } from '@/lib/web3/config'
import { useState } from 'react'
import { toast } from 'sonner'

interface WalletButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function WalletButton({ variant = 'default', size = 'default', className }: WalletButtonProps) {
  return (
    <RainbowConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button 
                    onClick={openConnectModal} 
                    variant={variant}
                    size={size}
                    className={className}
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet
                  </Button>
                )
              }

              if (chain.unsupported) {
                return (
                  <Button 
                    onClick={openChainModal} 
                    variant="destructive"
                    size={size}
                    className={className}
                  >
                    <Network className="mr-2 h-4 w-4" />
                    Unsupported Network
                  </Button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={openChainModal}
                    variant="outline"
                    size={size}
                    className="px-3"
                  >
                    {chain.hasIcon && (
                      <div className="w-4 h-4 mr-2 overflow-hidden rounded-full">
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-4 h-4"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant={variant}
                    size={size}
                    className={className}
                  >
                    <Avatar className="mr-2 h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {account.displayName?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {account.displayName}
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </RainbowConnectButton.Custom>
  )
}

// Enhanced wallet status component
export function WalletStatus() {
  const wallet = useWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleCopyAddress = async () => {
    if (wallet.address) {
      await navigator.clipboard.writeText(wallet.address)
      toast.success('Address copied to clipboard')
    }
  }

  const handleRefreshBalances = async () => {
    setIsRefreshing(true)
    // Trigger balance refresh
    try {
      await wallet.nativeBalance.refetch()
      toast.success('Balances refreshed')
    } catch (error) {
      toast.error('Failed to refresh balances')
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const openExplorer = () => {
    if (wallet.address && wallet.currentChain) {
      const explorerUrl = wallet.currentChain.blockExplorers?.default.url
      if (explorerUrl) {
        window.open(`${explorerUrl}/address/${wallet.address}`, '_blank')
      }
    }
  }

  if (!wallet.isConnected || !wallet.address) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-sm">Wallet not connected</span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <div className={`w-2 h-2 rounded-full ${
            wallet.connectionStatus === 'connected' ? 'bg-green-500' :
            wallet.connectionStatus === 'connecting' ? 'bg-yellow-500' :
            'bg-red-500'
          }`} />
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {wallet.shortAddress?.[2]?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-mono">{wallet.shortAddress}</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Wallet Status</DropdownMenuLabel>
        
        <DropdownMenuItem disabled className="flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground">Address</span>
            <Badge variant="secondary" className="text-xs font-mono">
              {wallet.shortAddress}
            </Badge>
          </div>
        </DropdownMenuItem>

        {wallet.currentChain && (
          <DropdownMenuItem disabled className="flex-col items-start">
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground">Network</span>
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{ borderColor: wallet.currentChainMetadata?.color }}
              >
                {wallet.currentChain.name}
              </Badge>
            </div>
          </DropdownMenuItem>
        )}

        <DropdownMenuItem disabled className="flex-col items-start">
          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground">Balance</span>
            <span className="text-xs font-mono">
              {parseFloat(wallet.nativeBalance.formatted).toFixed(4)} {wallet.nativeBalance.symbol}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopyAddress}>
          <Copy className="mr-2 h-4 w-4" />
          Copy Address
        </DropdownMenuItem>

        <DropdownMenuItem onClick={openExplorer}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View in Explorer
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={handleRefreshBalances}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Balances
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <RainbowConnectButton.Custom>
          {({ openAccountModal }) => (
            <DropdownMenuItem onClick={openAccountModal}>
              <LogOut className="mr-2 h-4 w-4" />
              Manage Wallet
            </DropdownMenuItem>
          )}
        </RainbowConnectButton.Custom>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Chain switcher component
export function ChainSwitcher() {
  const { switchToChain, currentChainId, isPending } = useWallet()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <Network className="mr-2 h-4 w-4" />
          Switch Network
          {isPending && <RefreshCw className="ml-2 h-3 w-3 animate-spin" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Network</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {supportedChains.map((chain) => {
          const isActive = chain.id === currentChainId
          const metadata = chain.id in chainMetadata 
            ? chainMetadata[chain.id as keyof typeof chainMetadata]
            : null

          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => switchToChain(chain.id)}
              className="flex items-center justify-between"
              disabled={isActive || isPending}
            >
              <div className="flex items-center gap-2">
                {metadata && (
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: metadata.color }}
                  />
                )}
                <span>{chain.name}</span>
              </div>
              {isActive && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="mr-1 h-2 w-2" />
                  Active
                </Badge>
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Connection status indicator
export function ConnectionIndicator() {
  const { connectionStatus, isConnected, currentChain } = useWallet()

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className={`w-2 h-2 rounded-full ${
        connectionStatus === 'connected' ? 'bg-green-500' : 
        connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
        'bg-red-500'
      }`} />
      <span>
        {connectionStatus === 'connected' && currentChain ? 
          `Connected to ${currentChain.name}` :
          connectionStatus === 'connecting' ? 
          'Connecting...' : 
          'Connection failed'
        }
      </span>
    </div>
  )
}