import { Activity, Users, Zap, Clock, TrendingUp, Wifi } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface QuickStatsProps {
  paymentsToday: number;
  avgProcessingTime: string;
  activeChannels: number;
  totalRevenue?: number;
}

export function QuickStats({ 
  paymentsToday = 47, 
  avgProcessingTime = "1.2s", 
  activeChannels = 3,
  totalRevenue = 2847.50
}: QuickStatsProps) {
  const [realTimeData, setRealTimeData] = useState({
    paymentsCount: paymentsToday,
    processingTime: parseFloat(avgProcessingTime),
    channels: activeChannels,
    revenue: totalRevenue
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate random fluctuations in real-time
      setRealTimeData(prev => ({
        paymentsCount: prev.paymentsCount + Math.floor(Math.random() * 3),
        processingTime: Math.max(0.8, prev.processingTime + (Math.random() - 0.5) * 0.2),
        channels: Math.min(5, Math.max(1, prev.channels + Math.floor(Math.random() * 3) - 1)),
        revenue: prev.revenue + Math.random() * 50
      }));
    }, 15000); // Update every 15 seconds

    return () => clearInterval(interval);
  }, []);

  const getChannelHealthColor = (count: number) => {
    if (count >= 3) return "text-green-400";
    if (count === 2) return "text-yellow-400";
    return "text-red-400";
  };

  const getProcessingTimeColor = (time: number) => {
    if (time <= 1.0) return "text-green-400";
    if (time <= 2.0) return "text-yellow-400";
    return "text-red-400";
  };

  const stats = [
    {
      label: "Payments Today",
      value: realTimeData.paymentsCount.toString(),
      icon: Zap,
      trend: "+8 this hour",
      color: "text-yellow-400"
    },
    {
      label: "Avg. Processing",
      value: `${realTimeData.processingTime.toFixed(1)}s`,
      icon: Clock,
      trend: "Yellow Network",
      color: getProcessingTimeColor(realTimeData.processingTime)
    },
    {
      label: "Active Channels",
      value: realTimeData.channels.toString(),
      icon: Wifi,
      trend: realTimeData.channels >= 3 ? "Optimal" : "Limited",
      color: getChannelHealthColor(realTimeData.channels)
    },
    {
      label: "Today's Revenue",
      value: `$${realTimeData.revenue.toFixed(0)}`,
      icon: TrendingUp,
      trend: "+12.5%",
      color: "text-green-400"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="glass group relative overflow-hidden rounded-lg border border-yellow-400/20 p-4 transition-all duration-300 hover:border-yellow-400/40 hover:scale-[1.02]"
        >
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          
          <div className="relative flex items-start justify-between">
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-wider text-gray-500">
                {stat.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className={`font-mono text-xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <div className="mt-2">
                <Badge 
                  variant="outline" 
                  className="text-xs border-yellow-400/20 bg-black/50 text-gray-400"
                >
                  {stat.trend}
                </Badge>
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400/10 ring-1 ring-yellow-400/20 transition-all group-hover:bg-yellow-400/20 group-hover:ring-yellow-400/30">
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </div>
          
          {/* Real-time pulse indicator */}
          <div className="absolute bottom-2 right-2">
            <div className="h-1.5 w-1.5 rounded-full bg-yellow-400/60 pulse-dot" />
          </div>
        </div>
      ))}
    </div>
  );
}
