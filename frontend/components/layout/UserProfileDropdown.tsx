'use client';

import { useAccount, useDisconnect } from 'wagmi';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Wallet,
  LogOut,
  Copy,
  Check,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

export function UserProfileDropdown() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [copied, setCopied] = useState(false);

  if (!isConnected || !address) return null;

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const initials = address.slice(2, 4).toUpperCase();

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 rounded-full border-primary/30 px-3 hover:border-primary hover:bg-primary/5"
        >
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="hidden font-medium text-sm sm:inline">{shortAddress}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-background backdrop-blur-xl border-border">
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Account
        </DropdownMenuLabel>
        
        {/* Wallet Info */}
        <div className="px-2 py-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-foreground">{shortAddress}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-success" />
                  ) : (
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-medium">
                Connected
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Portfolio Overview */}
        <DropdownMenuLabel className="text-xs uppercase tracking-wider text-muted-foreground">
          Portfolio
        </DropdownMenuLabel>
        
        <div className="space-y-3 px-2 py-2">
          {/* Total Balance */}
          <div className="rounded-2xl bg-secondary border border-border p-4 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Total Balance</span>
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">$8,622.17</div>
            <div className="mt-2 text-xs text-muted-foreground">Across 5 assets on 4 chains</div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-secondary p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">ETH</div>
              <div className="text-sm font-semibold text-foreground">2.4521</div>
              <div className="text-xs text-muted-foreground">$4,521.89</div>
            </div>
            <div className="rounded-xl bg-secondary p-3 border border-border">
              <div className="text-xs text-muted-foreground mb-1">USDC</div>
              <div className="text-sm font-semibold text-foreground">1,250.00</div>
              <div className="text-xs text-muted-foreground">$1,250.00</div>
            </div>
          </div>

          {/* Active Chains */}
          <div className="rounded-xl bg-secondary p-3 border border-border">
            <div className="mb-2 text-xs text-muted-foreground">Active Chains</div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-xs">
                Arbitrum
              </Badge>
              <Badge variant="outline" className="text-xs">
                Optimism
              </Badge>
              <Badge variant="outline" className="text-xs">
                Base
              </Badge>
              <Badge variant="outline" className="text-xs">
                Polygon
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Actions */}
        <DropdownMenuGroup>
          <DropdownMenuItem 
            className="cursor-pointer gap-2 text-sm text-destructive focus:text-destructive"
            onClick={() => disconnect()}
          >
            <LogOut className="h-4 w-4" />
            Disconnect Wallet
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
