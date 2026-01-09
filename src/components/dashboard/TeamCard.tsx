"use client";

/**
 * Team Card Component
 */

import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import type { Team } from "@/lib/actions/team";

interface TeamCardProps {
    team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
    return (
        <Link href={`/dashboard/teams/${team.id}`}>
            <Card className="hover:border-blue-200 hover:shadow-md transition-all cursor-pointer h-full">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{team.name}</CardTitle>
                                {team.description && (
                                    <CardDescription className="text-xs mt-1 line-clamp-2">
                                        {team.description}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                        <Users className="h-3 w-3" />
                        <span>{team.memberCount} member{team.memberCount !== 1 ? "s" : ""}</span>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}
