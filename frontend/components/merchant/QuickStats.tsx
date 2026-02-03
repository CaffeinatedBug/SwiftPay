import { Activity, Users, Zap, Clock } from "lucide-react";

interface QuickStatsProps {
  paymentsToday: number;
  avgProcessingTime: string;
  activeChannels: number;
}

export function QuickStats({ 
  paymentsToday = 47, 
  avgProcessingTime = "1.2s", 
  activeChannels = 3 
}: QuickStatsProps) {
  const stats = [
    {
      label: "Payments Today",
      value: paymentsToday.toString(),
      icon: Zap,
      trend: "+8"
    },
    {
      label: "Avg. Clearing",
      value: avgProcessingTime,
      icon: Clock,
      trend: null
    },
    {
      label: "Active Channels",
      value: activeChannels.toString(),
      icon: Activity,
      trend: null
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group relative overflow-hidden rounded-lg border border-border/50 bg-secondary/30 p-4 transition-colors hover:border-primary/30 hover:bg-secondary/50"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                {stat.trend && (
                  <span className="font-mono text-xs text-success">
                    +{stat.trend}
                  </span>
                )}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/5 ring-1 ring-primary/10 transition-all group-hover:bg-primary/10 group-hover:ring-primary/20">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
