import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMaps } from "@/lib/actions/map";
import { CreateMapButton } from "./CreateMapButton";
import { MapCard } from "@/components/dashboard/MapCard";
import { Brain, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
    const mapsResult = await listMaps();
    const maps = mapsResult.success ? mapsResult.data : [];

    const hasMaps = maps.length > 0;

    return (
        <div className="p-8 flex flex-col min-h-full">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Mind Maps</h1>
                    <p className="text-slate-500 mt-1">Create and manage your personal mind maps</p>
                </div>
                {/* Only show header button when maps exist */}
                {hasMaps && <CreateMapButton />}
            </div>

            {/* Maps Grid or Empty State */}
            {!hasMaps ? (
                <div className="flex-1 flex items-center justify-center">
                    <Card className="max-w-lg w-full text-center py-12 border-dashed border-2 border-slate-200 bg-white shadow-sm">
                        <CardHeader className="pb-4">
                            {/* Illustration */}
                            <div className="mx-auto mb-4 h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-blue-100">
                                <Brain className="h-12 w-12 text-blue-500" />
                            </div>
                            <CardTitle className="text-xl text-slate-900">Start Your First Mind Map</CardTitle>
                            <CardDescription className="text-base mt-2 text-slate-500">
                                Mind maps help you organize ideas visually. Create your first one to get started!
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <CreateMapButton size="lg" />

                            {/* Quick tip */}
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-4">
                                <Sparkles className="h-4 w-4 text-amber-500" />
                                <span>Tip: Use our AI Copilot to generate ideas automatically</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {maps.map((map) => (
                        <MapCard
                            key={map.id}
                            id={map.id}
                            title={map.title}
                            updatedAt={map.updatedAt}
                            isLocked={map.isLocked}
                            lockedByUserName={map.lockedByUserName}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
