/**
 * Team Detail Page
 * 
 * Shows team info and member list with ability to add/remove members.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Crown, Shield, User, Trash2 } from "lucide-react";
import { getTeam } from "@/lib/actions/team";
import { AddMemberDialog } from "@/components/dashboard/AddMemberDialog";
import { RemoveMemberButton } from "./RemoveMemberButton";

export const dynamic = "force-dynamic";

interface TeamDetailPageProps {
    params: Promise<{ teamId: string }>;
}

export default async function TeamDetailPage({ params }: TeamDetailPageProps) {
    const { teamId } = await params;
    const result = await getTeam(teamId);

    if (!result.success) {
        notFound();
    }

    const team = result.data;

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "owner": return <Crown className="h-3 w-3 text-amber-500" />;
            case "admin": return <Shield className="h-3 w-3 text-blue-500" />;
            default: return <User className="h-3 w-3 text-slate-400" />;
        }
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "owner": return "bg-amber-100 text-amber-700";
            case "admin": return "bg-blue-100 text-blue-700";
            default: return "bg-slate-100 text-slate-600";
        }
    };

    return (
        <div className="p-8">
            {/* Back Link */}
            <Link
                href="/dashboard/teams"
                className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Teams
            </Link>

            {/* Page Header */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Users className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{team.name}</h1>
                        {team.description && (
                            <p className="text-slate-500 mt-1">{team.description}</p>
                        )}
                        <p className="text-sm text-slate-400 mt-1">
                            {team.memberCount} member{team.memberCount !== 1 ? "s" : ""}
                        </p>
                    </div>
                </div>
                <AddMemberDialog teamId={teamId} existingMembers={team.members} />
            </div>

            {/* Members List */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Team Members</CardTitle>
                    <CardDescription>
                        People who have access to this team&apos;s shared mind maps
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="divide-y divide-slate-100">
                        {team.members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-medium">
                                        {member.name?.charAt(0)?.toUpperCase() || member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-900">
                                                {member.name || "Unnamed User"}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium capitalize ${getRoleBadge(member.role)}`}>
                                                {getRoleIcon(member.role)}
                                                {member.role}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{member.email}</p>
                                    </div>
                                </div>
                                {member.role !== "owner" && (
                                    <RemoveMemberButton
                                        teamId={teamId}
                                        memberUserId={member.userId}
                                        memberName={member.name || member.email}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
