import { MainLayout } from "@/components/layout/MainLayout";
import { MerchantPanel } from "@/components/panels/MerchantPanel";

export default function MerchantPage() {
    return (
        <MainLayout>
            <div className="h-[calc(100vh-48px)] overflow-auto md:h-screen">
                <MerchantPanel />
            </div>
        </MainLayout>
    );
}
