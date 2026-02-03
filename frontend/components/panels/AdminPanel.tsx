import { Activity, Server, Shield, Zap, Users, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock system stats
const systemStats = [
  { label: "Active Sessions", value: "1,247", icon: Users, trend: "+12%" },
  { label: "Payments/min", value: "342", icon: Zap, trend: "+8%" },
  { label: "Avg Latency", value: "45ms", icon: Activity, trend: "-15%" },
  { label: "Settlement Queue", value: "89", icon: ArrowRightLeft, trend: "stable" },
];

const hubStatus = {
  status: "operational",
  uptime: "99.97%",
  lastBlock: "19,847,293",
  connectedPeers: 24,
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
  return (
    <div className={`flex h-full flex-col ${embedded ? "p-0" : "p-6"}`}>
      {/* Header - hide when embedded since dialog has its own */}
      {!embedded && (
        <div className="mb-6">
          <h2 className="terminal-header mb-1">SYSTEM_ADMIN</h2>
          <h1 className="font-mono text-2xl font-bold text-foreground">
            Infrastructure Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor hub status, settlements, and network health
          </p>
        </div>
      )}

      {/* System Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {systemStats.map((stat) => (
          <Card key={stat.label} className="status-card">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="font-mono text-xl font-bold">{stat.value}</p>
                <p
                  className={`text-xs ${
                    stat.trend.startsWith("+")
                      ? "text-success"
                      : stat.trend.startsWith("-")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {stat.trend}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hub Status */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="status-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <Server className="h-4 w-4 text-primary" />
              HUB_STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
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
                <span className="text-sm text-muted-foreground">Latest Block</span>
                <span className="font-mono text-sm">{hubStatus.lastBlock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connected Peers</span>
                <span className="font-mono text-sm">{hubStatus.connectedPeers}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="status-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-mono text-sm">
              <Shield className="h-4 w-4 text-primary" />
              SECURITY_STATUS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Yellow Sessions</span>
                <span className="font-mono text-sm text-success">SECURE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Vault Contract</span>
                <span className="font-mono text-sm text-success">VERIFIED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">LI.FI Routes</span>
                <span className="font-mono text-sm text-success">AUDITED</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Audit</span>
                <span className="font-mono text-sm">2024-01-15</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Settlements */}
      <Card className="status-card flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            RECENT_SETTLEMENTS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSettlements.map((settlement) => (
              <div
                key={settlement.id}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-success" />
                  <div>
                    <div className="font-mono text-sm font-medium">
                      {settlement.batch}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {settlement.route} • {settlement.time}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold text-success">
                    ${settlement.amount}
                  </div>
                  <div className="text-xs text-success">
                    {settlement.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}