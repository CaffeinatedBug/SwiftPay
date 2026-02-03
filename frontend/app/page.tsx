import { MainLayout } from "@/components/layout/MainLayout";
import { UserPanel } from "@/components/panels/UserPanel";
import { MerchantPanel } from "@/components/panels/MerchantPanel";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-48px)] md:h-screen">
        {/* Left Panel - User App (50%) */}
        <div className="flex w-1/2 flex-col overflow-hidden border-r border-border">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <UserPanel />
          </div>
        </div>

        {/* Vertical Separator with glow */}
        <Separator
          orientation="vertical"
          className="hidden w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent md:block"
        />

        {/* Right Panel - Merchant Dashboard (50%) */}
        <div className="hidden w-1/2 flex-col overflow-hidden md:flex">
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <MerchantPanel />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
