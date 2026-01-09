"use client";

/**
 * MapCard Component - Light Theme
 * 
 * Displays a mind map card with actions:
 * - Open (navigate to editor)
 * - Share (open share dialog)
 * - Delete (with confirmation)
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, LockOpen, Clock, MoreHorizontal, Share2, Trash2, Edit, Brain } from "lucide-react";
import { deleteMap } from "@/lib/actions/map";
import { toast } from "sonner";

interface MapCardProps {
    id: string;
    title: string;
    updatedAt: Date;
    isLocked: boolean;
    lockedByUserName: string | null;
}

export function MapCard({ id, title, updatedAt, isLocked, lockedByUserName }: MapCardProps) {
    const router = useRouter();
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteMap(id);
            if (result.success) {
                toast.success("Map deleted successfully");
                router.refresh();
            } else {
                toast.error(result.error.message);
            }
        } catch (error) {
            toast.error("Failed to delete map");
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleShare = () => {
        // TODO: Open share dialog
        toast.info("Share feature coming soon!");
    };

    return (
        <>
            <Card className="hover:border-blue-200 hover:shadow-md transition-all h-full bg-white border-slate-200 group relative">
                {/* Actions Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-white/90 hover:bg-slate-100 text-slate-500 shadow-sm border border-slate-200"
                                onClick={(e) => e.preventDefault()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href={`/editor/${id}`} className="flex items-center">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Open Editor
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleShare}>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Card Content - Clickable to open */}
                <Link href={`/editor/${id}`} className="block">
                    <CardHeader className="pr-12">
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center border border-blue-100 shrink-0">
                                <Brain className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg text-slate-900 truncate">{title}</CardTitle>
                                <div className="mt-1">
                                    {isLocked ? (
                                        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                                            <Lock className="h-3 w-3 mr-1" />
                                            {lockedByUserName || "Locked"}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                            <LockOpen className="h-3 w-3 mr-1" />
                                            Available
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardFooter>
                        <div className="flex items-center text-sm text-slate-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Updated {formatRelativeTime(updatedAt)}
                        </div>
                    </CardFooter>
                </Link>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete &quot;{title}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the mind map
                            and all its contents.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

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
