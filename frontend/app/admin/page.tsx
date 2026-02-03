import { MainLayout } from "@/components/layout/MainLayout";
import { AdminPanel } from "@/components/panels/AdminPanel";

export default function AdminPage() {
    return (
        <MainLayout>
            <div className="h-[calc(100vh-48px)] overflow-auto md:h-screen">
                <AdminPanel />
            </div>
        </MainLayout>
    );
}
