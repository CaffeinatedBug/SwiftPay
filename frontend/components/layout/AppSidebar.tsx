"use client";

import { CreditCard, Store, Settings, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  {
    title: "User",
    url: "/",
    icon: CreditCard,
  },
  {
    title: "Merchant",
    url: "/merchant",
    icon: Store,
  },
  {
    title: "Admin",
    url: "/admin",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full w-16 flex-col items-center border-r border-border/50 bg-sidebar-background py-4">
        {/* Logo */}
        <div className="mb-6">
          <div className="group relative flex h-10 w-10 items-center justify-center rounded-lg bg-primary transition-all duration-300 hover:shadow-lg hover:shadow-primary/40">
            <Zap className="h-5 w-5 text-primary-foreground transition-transform duration-300 group-hover:scale-110" />
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-lg bg-primary/30 blur-md opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </div>

        {/* Divider */}
        <div className="mb-4 h-px w-8 bg-border/50" />

        {/* Navigation Items */}
        <nav className="flex flex-1 flex-col items-center gap-2">
          {navItems.map((item) => {
            const isActive = item.url === "/"
              ? pathname === "/"
              : pathname.startsWith(item.url);

            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <NavLink
                    href={item.url}
                    className="nav-rail-item group relative flex h-11 w-11 items-center justify-center rounded-lg transition-all duration-200"
                    activeClassName="nav-rail-item-active"
                  >
                    {/* Active indicator bar */}
                    <div
                      className={`absolute left-0 h-6 w-1 rounded-r-full transition-all duration-300 ${isActive
                          ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
                          : "bg-transparent"
                        }`}
                    />

                    {/* Icon container */}
                    <div
                      className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 ${isActive
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                    >
                      <item.icon className={`h-5 w-5 transition-all duration-200 ${isActive ? "drop-shadow-[0_0_4px_hsl(var(--primary))]" : ""
                        }`} />
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-lg bg-primary/0 blur-lg transition-all duration-300 group-hover:bg-primary/10" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  sideOffset={12}
                  className="border-border/50 bg-card px-3 py-1.5 font-mono text-xs uppercase tracking-wider"
                >
                  <span className="text-primary">&gt;</span> {item.title}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Bottom accent line */}
        <div className="mt-auto">
          <div className="h-px w-6 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    </TooltipProvider>
  );
}
