import { CheckCircle2, Clock, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChainBadge } from "@/components/ui/chain-badge";

type PaymentStatus = "completed" | "pending" | "processing";

interface Payment {
  id: string;
  txHash: string;
  customer: string;
  amount: string;
  token: string;
  chain: "arbitrum" | "base" | "polygon" | "ethereum" | "optimism";
  status: PaymentStatus;
  timestamp: string;
  timeAgo: string;
}

const mockPayments: Payment[] = [
  { 
    id: "1", 
    txHash: "0x7a2...4f3e", 
    customer: "0x3b1...9c2d", 
    amount: "125.00", 
    token: "USDC", 
    chain: "arbitrum", 
    status: "completed", 
    timestamp: "2024-01-15 14:32:18",
    timeAgo: "2 min ago" 
  },
  { 
    id: "2", 
    txHash: "0x9e4...1a7f", 
    customer: "0x8f2...3e1b", 
    amount: "42.50", 
    token: "USDT", 
    chain: "base", 
    status: "completed", 
    timestamp: "2024-01-15 14:28:45",
    timeAgo: "6 min ago" 
  },
  { 
    id: "3", 
    txHash: "0x2c7...8d4a", 
    customer: "0x1e9...7f2c", 
    amount: "89.00", 
    token: "ETH", 
    chain: "arbitrum", 
    status: "processing", 
    timestamp: "2024-01-15 14:25:12",
    timeAgo: "9 min ago" 
  },
  { 
    id: "4", 
    txHash: "0x5f1...2b9e", 
    customer: "0x4a3...6c8d", 
    amount: "215.75", 
    token: "USDC", 
    chain: "polygon", 
    status: "completed", 
    timestamp: "2024-01-15 14:18:33",
    timeAgo: "16 min ago" 
  },
  { 
    id: "5", 
    txHash: "0x8b4...1e3f", 
    customer: "0x7d2...9a4c", 
    amount: "67.25", 
    token: "USDC", 
    chain: "base", 
    status: "pending", 
    timestamp: "2024-01-15 14:12:08",
    timeAgo: "22 min ago" 
  },
  { 
    id: "6", 
    txHash: "0x3e9...7c2b", 
    customer: "0x2f8...4d1a", 
    amount: "350.00", 
    token: "USDC", 
    chain: "ethereum", 
    status: "completed", 
    timestamp: "2024-01-15 14:05:44",
    timeAgo: "29 min ago" 
  },
];

const StatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = {
    completed: {
      icon: CheckCircle2,
      label: "Cleared",
      className: "bg-success/10 text-success ring-success/20"
    },
    processing: {
      icon: Clock,
      label: "Clearing",
      className: "bg-primary/10 text-primary ring-primary/20"
    },
    pending: {
      icon: AlertCircle,
      label: "Pending",
      className: "bg-muted text-muted-foreground ring-border"
    }
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ring-1 ${className}`}>
      <Icon className="h-3 w-3" />
      <span className="font-mono text-xs font-medium">{label}</span>
    </div>
  );
};

export function PaymentsTable() {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-mono text-sm">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            RECENT_PAYMENTS
          </CardTitle>
          <span className="font-mono text-xs text-muted-foreground">
            {mockPayments.length} transactions
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Transaction
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Amount
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Chain
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">
                Time
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayments.map((payment) => (
              <TableRow 
                key={payment.id} 
                className="group border-border/30 transition-colors hover:bg-secondary/50"
              >
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary ring-1 ring-border/50">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{payment.id}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {payment.txHash}
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        from {payment.customer}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-baseline gap-1">
                    <span className="font-mono text-sm font-bold text-foreground">
                      +${payment.amount}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {payment.token}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <ChainBadge chain={payment.chain} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={payment.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div>
                    <div className="font-mono text-xs text-foreground">
                      {payment.timeAgo}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {payment.timestamp}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
