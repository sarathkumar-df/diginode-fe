import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listMaps } from "@/lib/actions/map";
import { CreateMapButton } from "./CreateMapButton";
import { MapCard } from "@/components/dashboard/MapCard";

export default async function DashboardPage() {
    const mapsResult = await listMaps();
    const maps = mapsResult.success ? mapsResult.data : [];

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Mind Maps</h1>
                    <p className="text-slate-500 mt-1">Create and manage your personal mind maps</p>
                </div>
                <CreateMapButton />
            </div>

            {/* Maps Grid */}
            {maps.length === 0 ? (
                <Card className="max-w-md mx-auto text-center py-12">
                    <CardHeader>
                        <CardTitle>No mind maps yet</CardTitle>
                        <CardDescription>
                            Create your first mind map to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateMapButton />
                    </CardContent>
                </Card>
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
