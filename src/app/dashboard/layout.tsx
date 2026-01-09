/**
 * Dashboard Layout with Sidebar and Header - Light Theme
 * 
 * Provides the main layout structure for all dashboard pages
 * with the navigation sidebar and top header.
 */

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect("/auth/signin");
    }

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Sidebar */}
            <Sidebar
                userEmail={session.user.email || undefined}
                userName={session.user.name || undefined}
            />

            {/* Main Area with Header */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <DashboardHeader />

                {/* Main Content */}
                <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    {children}
                </main>
            </div>
        </div>
    );
}
