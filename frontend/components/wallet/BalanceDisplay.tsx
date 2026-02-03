'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { 
  RefreshCw,
  Eye,
  EyeOff,
  TrendingUp,
  Wallet,
  ExternalLink,
  Zap
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useWallet, useTokenSelector } from '@/lib/web3/hooks'
import { formatUnits } from 'viem'
import { chainMetadata, supportedChains, getTokensForChain } from '@/lib/web3/config'
import Image from 'next/image'

// Chain badge component
interface ChainBadgeProps {
  chainId: number
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  interactive?: boolean
  onClick?: () => void
}

export function ChainBadge({ chainId, size = 'md', showName = false, interactive = false, onClick }: ChainBadgeProps) {
  const chain = supportedChains.find(c => c.id === chainId)
  const metadata = chainMetadata[chainId as keyof typeof chainMetadata]
  
  if (!chain || !metadata) return null

  const sizeClasses = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-8 w-8 text-base'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  }

  const BadgeContent = (
    <Badge 
      variant="outline" 
      className={`inline-flex items-center gap-1 ${sizeClasses[size]} ${interactive ? 'cursor-pointer hover:bg-accent' : ''}`}
      style={{ borderColor: metadata.color }}
      onClick={onClick}
    >
      <div 
        className={`rounded-full ${iconSizeClasses[size]}`}
        style={{ backgroundColor: metadata.color }}
      />
      <span className="font-medium">{metadata.shortName}</span>
      {showName && <span className="hidden sm:inline">{chain.name}</span>}
    </Badge>
  )

  if (interactive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {BadgeContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{chain.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return BadgeContent
}

// Token badge component
interface TokenBadgeProps {
  symbol: string
  logoURI?: string
  size?: 'sm' | 'md' | 'lg'
  balance?: string
  showBalance?: boolean
  interactive?: boolean
  onClick?: () => void
}

export function TokenBadge({ 
  symbol, 
  logoURI, 
  size = 'md', 
  balance, 
  showBalance = false, 
  interactive = false,
  onClick 
}: TokenBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <Badge 
      variant="secondary"
      className={`inline-flex items-center gap-2 ${sizeClasses[size]} ${interactive ? 'cursor-pointer hover:bg-accent' : ''}`}
      onClick={onClick}
    >
      {logoURI && (
        <Image
          src={logoURI}
          alt={`${symbol} logo`}
          width={16}
          height={16}
          className={`rounded-full ${iconSizeClasses[size]}`}
        />
      )}
      <span className="font-medium">{symbol}</span>
      {showBalance && balance && (
        <span className="text-muted-foreground">
          {parseFloat(balance).toFixed(4)}
        </span>
      )}
    </Badge>
  )
}

// Balance display component
interface BalanceDisplayProps {
  balance: string
  symbol: string
  formatted?: string
  isLoading?: boolean
  chainId?: number
  showUSD?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function BalanceDisplay({ 
  balance, 
  symbol, 
  formatted,
  isLoading, 
  chainId,
  showUSD = false,
  size = 'md',
  className 
}: BalanceDisplayProps) {
  const [isHidden, setIsHidden] = useState(false)

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  }

  if (isLoading) {
    return <Skeleton className={`h-6 w-24 ${className}`} />
  }

  const displayBalance = formatted || formatUnits(BigInt(balance || '0'), 18)
  const formattedBalance = parseFloat(displayBalance).toFixed(4)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-mono font-medium ${sizeClasses[size]}`}>
        {isHidden ? '••••••' : formattedBalance}
      </span>
      <span className="text-muted-foreground">{symbol}</span>
      {chainId && <ChainBadge chainId={chainId} size="sm" />}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsHidden(!isHidden)}
        className="p-1 h-6 w-6"
      >
        {isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
      </Button>
    </div>
  )
}

// Token selector component
export function TokenSelector({ chainId, onSelect }: { chainId?: number, onSelect?: (symbol: string) => void }) {
  const wallet = useWallet()
  const { selectedToken, availableTokens, selectToken } = useTokenSelector(chainId)
  const targetChainId = chainId || wallet.currentChainId

  const handleSelect = (value: string) => {
    selectToken(value)
    onSelect?.(value)
  }

  return (
    <Select value={selectedToken} onValueChange={handleSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select token">
          {selectedToken && (
            <div className="flex items-center gap-2">
              <TokenBadge 
                symbol={selectedToken}
                logoURI={availableTokens[selectedToken]?.logoURI}
                size="sm"
              />
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(availableTokens).map(([symbol, token]) => (
          <SelectItem key={symbol} value={symbol}>
            <div className="flex items-center gap-2">
              {token.logoURI && (
                <Image
                  src={token.logoURI}
                  alt={`${symbol} logo`}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              )}
              <span className="font-medium">{symbol}</span>
              <span className="text-muted-foreground text-xs">{token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Multi-chain balance overview
export function MultiChainBalanceOverview() {
  const wallet = useWallet()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await wallet.nativeBalance.refetch()
    } finally {
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  if (!wallet.isConnected) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Wallet className="mx-auto h-8 w-8 mb-2" />
            <p>Connect wallet to view balances</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Portfolio Overview
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current chain balance */}
        {wallet.currentChain && (
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ChainBadge chainId={wallet.currentChainId} showName />
                <Badge variant="outline" className="text-xs">
                  <Zap className="mr-1 h-2 w-2" />
                  Current
                </Badge>
              </div>
              <Button variant="ghost" size="sm">
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>

            {/* Native token balance */}
            <div className="space-y-2">
              <BalanceDisplay
                balance={wallet.nativeBalance.balance}
                symbol={wallet.nativeBalance.symbol}
                formatted={wallet.nativeBalance.formatted}
                isLoading={wallet.nativeBalance.isLoading}
                size="lg"
              />

              {/* Token balances */}
              <div className="space-y-2 mt-4">
                {wallet.currentChainTokens.map((tokenBalance) => (
                  <div key={tokenBalance.token.symbol} className="flex items-center justify-between">
                    <TokenBadge
                      symbol={tokenBalance.token.symbol}
                      logoURI={tokenBalance.token.logoURI}
                    />
                    <BalanceDisplay
                      balance={tokenBalance.balance}
                      symbol={tokenBalance.token.symbol}
                      formatted={tokenBalance.formatted}
                      isLoading={tokenBalance.isLoading}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Multi-chain summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportedChains.slice(0, 6).map((chain) => {
            const isActive = chain.id === wallet.currentChainId
            const metadata = chainMetadata[chain.id as keyof typeof chainMetadata]
            
            if (!metadata) return null

            return (
              <div
                key={chain.id}
                className={`p-3 rounded-lg border transition-colors ${
                  isActive ? 'bg-accent' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <ChainBadge chainId={chain.id} size="sm" />
                  {isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {isActive ? (
                    <BalanceDisplay
                      balance={wallet.nativeBalance.balance}
                      symbol={wallet.nativeBalance.symbol}
                      formatted={wallet.nativeBalance.formatted}
                      isLoading={wallet.nativeBalance.isLoading}
                      size="sm"
                    />
                  ) : (
                    <span>Switch to view</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}