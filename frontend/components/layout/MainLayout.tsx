import { ReactNode } from "react";
import { WalletHeader } from "./WalletHeader";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Header with wallet integration */}
      <WalletHeader />
      
      {/* Main content with cyber grid background */}
      <main className="relative flex-1 cyber-grid-animated noise-overlay">
        {children}
      </main>
    </div>
  );
}
