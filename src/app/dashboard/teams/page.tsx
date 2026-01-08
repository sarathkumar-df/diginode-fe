/**
 * Teams Page
 * 
 * Lists all teams the user belongs to and allows team creation.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus } from "lucide-react";

export default function TeamsPage() {
    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
                    <p className="text-slate-500 mt-1">Create and manage teams for collaboration</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                </Button>
            </div>

            {/* Empty State */}
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
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Team
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
