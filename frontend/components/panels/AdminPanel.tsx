"use client";

import { Activity, Server, Shield, Zap, Users, ArrowRightLeft, CheckCircle, Clock, AlertTriangle, DollarSign, TrendingUp, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";

// Enhanced payment data with real-time updates
interface Payment {
  id: string;
  timestamp: number;
  amount: string;
  currency: string;
  status: 'cleared' | 'pending' | 'failed';
  customerAddress: string;
  transactionHash?: string;
  channel: string;
  processingTime: number;
}

// Mock payment history data
const generateMockPayments = (): Payment[] => [
  { id: 'PAY-001', timestamp: Date.now() - 300000, amount: '25.00', currency: 'USDC', status: 'cleared', customerAddress: '0x742d...8f3e', transactionHash: '0xabc123...', channel: 'YN-CH-001', processingTime: 1200 },
  { id: 'PAY-002', timestamp: Date.now() - 600000, amount: '150.00', currency: 'USDC', status: 'cleared', customerAddress: '0x891a...2b4c', transactionHash: '0xdef456...', channel: 'YN-CH-002', processingTime: 850 },
  { id: 'PAY-003', timestamp: Date.now() - 900000, amount: '75.50', currency: 'USDC', status: 'pending', customerAddress: '0x123c...9d8e', channel: 'YN-CH-001', processingTime: 0 },
  { id: 'PAY-004', timestamp: Date.now() - 1200000, amount: '200.00', currency: 'USDC', status: 'cleared', customerAddress: '0x456f...7a1b', transactionHash: '0x789ghi...', channel: 'YN-CH-003', processingTime: 1500 },
  { id: 'PAY-005', timestamp: Date.now() - 1800000, amount: '42.25', currency: 'USDC', status: 'failed', customerAddress: '0x789e...4c2d', channel: 'YN-CH-002', processingTime: 0 },
];

// Enhanced system stats with real-time data
const systemStats = [
  { label: "Total Payments", value: "1,847", icon: Users, trend: "+47 today", color: "text-primary" },
  { label: "Cleared Balance", value: "$12,847.50", icon: DollarSign, trend: "+$2,450 today", color: "text-success" },
  { label: "Pending Balance", value: "$2,450.00", icon: Clock, trend: "3 payments", color: "text-yellow-500" },
  { label: "Avg Process Time", value: "1.2s", icon: Zap, trend: "-0.3s today", color: "text-blue-500" },
];

const hubStatus = {
  status: "operational",
  uptime: "99.97%",
  lastBlock: "19,847,293",
  connectedPeers: 24,
  activeChannels: 3,
  channelHealth: "excellent"
};

const recentSettlements = [
  { id: 1, batch: "BATCH-4829", amount: "15,420.00", route: "Arbitrum → Arc", status: "completed", time: "2 min ago" },
  { id: 2, batch: "BATCH-4828", amount: "8,750.00", route: "Base → Arc", status: "completed", time: "15 min ago" },
  { id: 3, batch: "BATCH-4827", amount: "22,100.00", route: "Polygon → Arc", status: "completed", time: "1 hour ago" },
];

interface AdminPanelProps {
  embedded?: boolean;
}

export function AdminPanel({ embedded = false }: AdminPanelProps) {
  const [payments, setPayments] = useState<Payment[]>(generateMockPayments());
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Calculate totals
  const totalCleared = payments
    .filter(p => p.status === 'cleared')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const totalPending = payments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const avgProcessingTime = payments
    .filter(p => p.status === 'cleared' && p.processingTime > 0)
    .reduce((sum, p, _, arr) => sum + p.processingTime / arr.length, 0);

  // Real-time updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'cleared':
        return <Badge className="bg-success/10 text-success border-success/20"><CheckCircle className="w-3 h-3 mr-1" />Cleared</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Failed</Badge>;
    }
  };

  return (
    <div className={`flex h-full flex-col ${embedded ? "p-0" : "p-6"}`}>
      {/* Header - hide when embedded since dialog has its own */}
      {!embedded && (
        <div className="mb-6">
          <h2 className="terminal-header mb-1">ADMIN_DASHBOARD</h2>
          <h1 className="font-mono text-2xl font-bold text-foreground">
            Payment Operations Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor payments, balances, and system health in real-time
          </p>
        </div>
      )}

      {/* Enhanced Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <Card key={stat.label} className="status-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-mono text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outstanding Balance Summary */}
      <div className="mb-6">
        <Card className="bg-gradient-to-r from-primary/5 via-background to-success/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between font-mono text-sm">
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                BALANCE_OVERVIEW
              </span>
              <Button variant="ghost" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
                <Activity className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Total Cleared</div>
                <div className="font-mono text-2xl font-bold text-success">${totalCleared.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Ready to settle</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Pending Clearing</div>
                <div className="font-mono text-2xl font-bold text-yellow-600">${totalPending.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">In progress</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground mb-1">Avg Process Time</div>
                <div className="font-mono text-2xl font-bold text-primary">{(avgProcessingTime/1000).toFixed(1)}s</div>
                <div className="text-xs text-muted-foreground">Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <div className="mb-6 flex-1">
        <Card className="status-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between font-mono text-sm">
              <span className="flex items-center gap-2">
                <ArrowRightLeft className="h-4 w-4 text-primary" />
                PAYMENT_HISTORY
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {payments.length} total
                </Badge>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono text-xs">ID</TableHead>
                  <TableHead className="font-mono text-xs">Time</TableHead>
                  <TableHead className="font-mono text-xs">Amount</TableHead>
                  <TableHead className="font-mono text-xs">Customer</TableHead>
                  <TableHead className="font-mono text-xs">Channel</TableHead>
                  <TableHead className="font-mono text-xs">Status</TableHead>
                  <TableHead className="font-mono text-xs">Processing</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow 
                    key={payment.id} 
                    className="cursor-pointer hover:bg-secondary/50"
                    onClick={() => setSelectedPayment(payment)}
                  >
                    <TableCell className="font-mono text-xs">{payment.id}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {new Date(payment.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold">
                      ${payment.amount} {payment.currency}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {payment.customerAddress}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">
                      {payment.channel}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.processingTime > 0 ? `${(payment.processingTime/1000).toFixed(1)}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* System Status & Settlements */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Enhanced Hub Status */}
        <Card className="status-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <Server className="h-4 w-4 text-primary" />
              YELLOW_NETWORK_STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connection</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span className="font-mono text-sm text-success">
                    {hubStatus.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Uptime</span>
                <span className="font-mono text-sm">{hubStatus.uptime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Channels</span>
                <span className="font-mono text-sm text-primary">{hubStatus.activeChannels}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Channel Health</span>
                <Badge className="bg-success/10 text-success border-success/20 capitalize">
                  {hubStatus.channelHealth}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Peers</span>
                <span className="font-mono text-sm">{hubStatus.connectedPeers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Settlements */}
        <Card className="status-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              RECENT_SETTLEMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSettlements.map((settlement) => (
                <div key={settlement.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {settlement.batch}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{settlement.time}</span>
                    </div>
                    <div className="font-mono text-sm font-semibold">
                      ${settlement.amount} USDC
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {settlement.route}
                    </div>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}