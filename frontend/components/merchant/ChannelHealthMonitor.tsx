'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wifi, 
  WifiOff, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Signal,
  Server
} from 'lucide-react';

interface ChannelMetrics {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'degraded';
  latency: number;
  throughput: number;
  uptime: number;
  lastSeen: Date;
  messagesProcessed: number;
}

interface ChannelHealthMonitorProps {
  className?: string;
}

export function ChannelHealthMonitor({ className = '' }: ChannelHealthMonitorProps) {
  const [channels] = useState<ChannelMetrics[]>([
    {
      id: 'YN-CH-001',
      name: 'Primary Channel',
      status: 'connected',
      latency: 45,
      throughput: 850,
      uptime: 99.97,
      lastSeen: new Date(),
      messagesProcessed: 12847
    },
    {
      id: 'YN-CH-002', 
      name: 'Backup Channel',
      status: 'connected',
      latency: 67,
      throughput: 620,
      uptime: 98.84,
      lastSeen: new Date(Date.now() - 1000),
      messagesProcessed: 8934
    },
    {
      id: 'YN-CH-003',
      name: 'Fallback Channel', 
      status: 'degraded',
      latency: 120,
      throughput: 340,
      uptime: 95.20,
      lastSeen: new Date(Date.now() - 30000),
      messagesProcessed: 3421
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const getStatusConfig = (status: ChannelMetrics['status']) => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          icon: CheckCircle2,
          label: 'Connected'
        };
      case 'degraded':
        return {
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10', 
          borderColor: 'border-yellow-500/20',
          icon: AlertTriangle,
          label: 'Degraded'
        };
      case 'disconnected':
        return {
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
          borderColor: 'border-destructive/20',
          icon: WifiOff,
          label: 'Disconnected'
        };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const overallHealth = channels.reduce((acc, ch) => {
    if (ch.status === 'connected') return acc + 1;
    if (ch.status === 'degraded') return acc + 0.5;
    return acc;
  }, 0) / channels.length;

  return (
    <Card className={`status-card ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between font-mono text-sm">
          <span className="flex items-center gap-2">
            <Signal className="h-4 w-4 text-primary" />
            CHANNEL_HEALTH_MONITOR
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-success border-success/20">
              {(overallHealth * 100).toFixed(0)}% Healthy
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Overall Network Status */}
          <div className="rounded-lg border border-border/50 bg-secondary/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <span className="font-mono text-sm font-semibold">Yellow Network</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${overallHealth >= 0.8 ? 'bg-success animate-pulse' : 'bg-yellow-500'}`} />
                <span className="font-mono text-xs text-success">
                  {channels.filter(ch => ch.status === 'connected').length}/{channels.length} Active
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
                <div className="font-mono text-lg font-bold text-success">
                  {Math.round(channels.reduce((acc, ch) => acc + ch.latency, 0) / channels.length)}ms
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Total Throughput</div>
                <div className="font-mono text-lg font-bold text-primary">
                  {channels.reduce((acc, ch) => acc + ch.throughput, 0)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Messages/min</div>
                <div className="font-mono text-lg font-bold text-success">
                  {channels.reduce((acc, ch) => acc + ch.messagesProcessed, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Individual Channel Status */}
          <div className="space-y-3">
            {channels.map((channel) => {
              const config = getStatusConfig(channel.status);
              const Icon = config.icon;
              
              return (
                <div key={channel.id} className={`rounded-lg border p-4 ${config.borderColor} ${config.bgColor}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.bgColor} ring-1 ${config.borderColor}`}>
                        <Icon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="font-mono text-sm font-semibold">{channel.name}</div>
                        <div className="font-mono text-xs text-muted-foreground">{channel.id}</div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${config.color} border-current/20`}>
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Latency</div>
                      <div className="font-mono text-sm font-bold text-success">
                        {Math.round(channel.latency)}ms
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Throughput</div>
                      <div className="font-mono text-sm font-bold text-primary">
                        {Math.round(channel.throughput)}/min
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                      <div className="font-mono text-sm font-bold text-success">
                        {channel.uptime.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Last Seen</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {Math.round((Date.now() - channel.lastSeen.getTime()) / 1000)}s ago
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}