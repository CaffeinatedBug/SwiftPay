"use client";

import { useState, useMemo } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChainBadge } from "@/components/ui/chain-badge";
import { cn } from "@/lib/utils";

export interface TokenAsset {
  symbol: string;
  name: string;
  chain: string;
  balance: number;
  usdValue: number;
  icon: string;
}

interface TokenSelectorModalProps {
  assets: TokenAsset[];
  selectedAsset: TokenAsset;
  onSelect: (asset: TokenAsset) => void;
  trigger?: React.ReactNode;
}

// Chain configuration
const chainConfig: Record<string, { color: string; logo: string }> = {
  Arbitrum: { color: "#28A0F0", logo: "◆" },
  Base: { color: "#0052FF", logo: "◉" },
  Polygon: { color: "#8247E5", logo: "⬡" },
  Ethereum: { color: "#627EEA", logo: "⟠" },
  Optimism: { color: "#FF0420", logo: "◎" },
};

// Group assets by chain
function groupByChain(assets: TokenAsset[]): Record<string, TokenAsset[]> {
  return assets.reduce((acc, asset) => {
    if (!acc[asset.chain]) {
      acc[asset.chain] = [];
    }
    acc[asset.chain].push(asset);
    return acc;
  }, {} as Record<string, TokenAsset[]>);
}

export function TokenSelectorModal({ assets, selectedAsset, onSelect, trigger }: TokenSelectorModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAssets = useMemo(() => {
    if (!searchQuery) return assets;
    const query = searchQuery.toLowerCase();
    return assets.filter(
      (asset) =>
        asset.symbol.toLowerCase().includes(query) ||
        asset.name.toLowerCase().includes(query) ||
        asset.chain.toLowerCase().includes(query)
    );
  }, [assets, searchQuery]);

  const groupedAssets = useMemo(() => groupByChain(filteredAssets), [filteredAssets]);
  const chainOrder = ["Ethereum", "Arbitrum", "Base", "Optimism", "Polygon"];
  const sortedChains = Object.keys(groupedAssets).sort(
    (a, b) => chainOrder.indexOf(a) - chainOrder.indexOf(b)
  );

  const handleSelect = (asset: TokenAsset) => {
    onSelect(asset);
    setOpen(false);
    setSearchQuery("");
  };

  const defaultTrigger = (
    <button className="group flex w-full items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-3 transition-all hover:border-primary/50 hover:bg-secondary/50">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-lg">
            {selectedAsset.icon}
          </div>
          <ChainBadge chain={selectedAsset.chain} className="absolute -bottom-1 -right-1 h-4 w-4 text-[8px]" />
        </div>
        <div className="text-left">
          <span className="font-mono text-sm font-semibold">{selectedAsset.symbol}</span>
          <span className="ml-2 text-xs text-muted-foreground">on {selectedAsset.chain}</span>
        </div>
      </div>
      <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-hover:text-primary" />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-hidden border-border/50 bg-[#0c0c0c] p-0 sm:max-w-md">
        {/* Header */}
        <DialogHeader className="border-b border-border/30 px-4 py-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
              Select Token
            </DialogTitle>
          </div>
          
          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or chain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-border/30 bg-background/50 pl-10 font-mono text-sm placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-primary/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Token List */}
        <div className="max-h-[60vh] overflow-y-auto">
          {sortedChains.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="font-mono text-sm text-muted-foreground">No tokens found</p>
              <p className="text-xs text-muted-foreground/50">Try a different search term</p>
            </div>
          ) : (
            sortedChains.map((chain) => (
              <div key={chain} className="border-b border-border/20 last:border-b-0">
                {/* Chain Header */}
                <div 
                  className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/10 bg-[#0a0a0a]/95 px-4 py-2 backdrop-blur-sm"
                  style={{ borderLeftColor: chainConfig[chain]?.color, borderLeftWidth: "3px" }}
                >
                  <span 
                    className="text-sm"
                    style={{ color: chainConfig[chain]?.color }}
                  >
                    {chainConfig[chain]?.logo}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {chain}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground/50">
                    {groupedAssets[chain].length} {groupedAssets[chain].length === 1 ? "token" : "tokens"}
                  </span>
                </div>

                {/* Tokens in this chain */}
                <div className="py-1">
                  {groupedAssets[chain].map((asset) => {
                    const isSelected = 
                      selectedAsset.symbol === asset.symbol && 
                      selectedAsset.chain === asset.chain;

                    return (
                      <button
                        key={`${asset.symbol}-${asset.chain}`}
                        onClick={() => handleSelect(asset)}
                        className={cn(
                          "group relative flex w-full items-center justify-between px-4 py-3 transition-all duration-150",
                          isSelected
                            ? "bg-primary/10"
                            : "hover:bg-secondary/50"
                        )}
                      >
                        {/* Selection indicator - left border glow */}
                        {isSelected && (
                          <>
                            <div className="absolute inset-y-0 left-0 w-1 bg-primary shadow-[0_0_12px_2px_hsl(var(--primary))]" />
                            <div className="absolute inset-0 border border-primary/40 rounded-none pointer-events-none" />
                          </>
                        )}

                        <div className="flex items-center gap-3">
                          {/* Token Icon with Chain Badge */}
                          <div className="relative">
                            <div 
                              className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full text-xl transition-all",
                                isSelected 
                                  ? "bg-primary/20 shadow-[0_0_16px_4px_hsl(var(--primary)/0.3)]" 
                                  : "bg-muted group-hover:bg-muted/80"
                              )}
                            >
                              {asset.icon}
                            </div>
                            <ChainBadge chain={asset.chain} className="absolute -bottom-0.5 -right-0.5" />
                          </div>

                          {/* Token Info */}
                          <div className="text-left">
                            <div className="flex items-center gap-2">
                              <span 
                                className={cn(
                                  "font-mono text-sm font-semibold transition-colors",
                                  isSelected ? "text-primary" : "text-foreground"
                                )}
                              >
                                {asset.symbol}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {asset.name}
                            </div>
                          </div>
                        </div>

                        {/* Balance */}
                        <div className="text-right">
                          <div 
                            className={cn(
                              "font-mono text-sm font-bold transition-colors",
                              isSelected ? "text-primary text-glow-yellow" : "text-foreground"
                            )}
                          >
                            {asset.balance.toLocaleString(undefined, { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 4 
                            })}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground">
                            ${asset.usdValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 bg-[#080808] px-4 py-3">
          <p className="text-center font-mono text-xs text-muted-foreground/50">
            {assets.length} tokens across {new Set(assets.map(a => a.chain)).size} chains
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
