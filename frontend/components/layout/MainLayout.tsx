import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Compact navigation rail */}
      <AppSidebar />
      
      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Main content with cyber grid background */}
        <main className="relative flex-1 cyber-grid-animated noise-overlay">
          {children}
        </main>
      </div>
    </div>
  );
}
