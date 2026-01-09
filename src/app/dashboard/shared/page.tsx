/**
 * Shared with Me Page
 * 
 * Lists all mind maps shared with the current user (directly or via teams).
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Clock, User, Eye, Edit, Brain } from "lucide-react";
import Link from "next/link";
import { getSharedWithMeMaps } from "@/lib/actions/share";

function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(date).toLocaleDateString();
}

export default async function SharedPage() {
    const result = await getSharedWithMeMaps();
    const sharedMaps = result.success ? result.data : [];

    return (
        <div className="p-8">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">Shared with Me</h1>
                <p className="text-slate-500 mt-1">Mind maps that others have shared with you</p>
            </div>

            {sharedMaps.length === 0 ? (
                /* Empty State */
                <Card className="max-w-md mx-auto text-center py-12">
                    <CardHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                            <Share2 className="h-6 w-6 text-green-600" />
                        </div>
                        <CardTitle>Nothing shared yet</CardTitle>
                        <CardDescription>
                            When someone shares a mind map with you, it will appear here
                        </CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                /* Shared Maps Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sharedMaps.map((map) => (
                        <Link key={map.id} href={`/editor/${map.id}`}>
                            <Card className="hover:border-blue-200 hover:shadow-md transition-all h-full bg-white border-slate-200 group cursor-pointer">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start gap-3">
                                        {/* Icon */}
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                                            <Brain className="h-6 w-6 text-white" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-base font-semibold text-slate-900 truncate">
                                                {map.title}
                                            </CardTitle>

                                            {/* Shared By */}
                                            <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                                                <User className="h-3.5 w-3.5" />
                                                <span className="truncate">Shared by {map.sharedBy}</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-0">
                                    <div className="flex items-center justify-between">
                                        {/* Permission Badge */}
                                        <Badge
                                            variant="outline"
                                            className={map.permission === "edit"
                                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                                : "bg-slate-50 text-slate-600 border-slate-200"
                                            }
                                        >
                                            {map.permission === "edit" ? (
                                                <><Edit className="h-3 w-3 mr-1" /> Can Edit</>
                                            ) : (
                                                <><Eye className="h-3 w-3 mr-1" /> View Only</>
                                            )}
                                        </Badge>

                                        {/* Time */}
                                        <div className="flex items-center gap-1 text-sm text-slate-400">
                                            <Clock className="h-3.5 w-3.5" />
                                            <span>{formatRelativeTime(map.sharedAt)}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
