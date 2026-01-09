/**
 * Teams Page
 * 
 * Lists all teams the user belongs to and allows team creation.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus } from "lucide-react";
import { listTeams } from "@/lib/actions/team";
import { CreateTeamDialog } from "@/components/dashboard/CreateTeamDialog";
import { TeamCard } from "@/components/dashboard/TeamCard";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
    const result = await listTeams();
    const teams = result.success ? result.data : [];
    const hasTeams = teams.length > 0;

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
                    <p className="text-slate-500 mt-1">Create and manage teams for collaboration</p>
                </div>
                {hasTeams && <CreateTeamDialog />}
            </div>

            {/* Teams Grid or Empty State */}
            {!hasTeams ? (
                <Card className="max-w-md mx-auto text-center py-12">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <CardTitle>No teams yet</CardTitle>
                        <CardDescription>
                            Create a team to start collaborating with others on mind maps
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateTeamDialog
                            trigger={
                                <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                                    <Plus className="h-4 w-4" />
                                    Create Your First Team
                                </button>
                            }
                        />
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <TeamCard key={team.id} team={team} />
                    ))}
                </div>
            )}
        </div>
    );
}
