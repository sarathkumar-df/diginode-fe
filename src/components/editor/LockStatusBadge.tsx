"use client";

/**
 * Lock Status Badge Component
 * 
 * Visual indicator for lock state.
 */

import { Badge } from "@/components/ui/badge";
import { Lock, LockOpen, AlertTriangle } from "lucide-react";
import type { MapLockState } from "@/hooks/useMapLock";

interface LockStatusBadgeProps {
    status: MapLockState["status"];
    lockedByUserName?: string;
    className?: string;
}

export function LockStatusBadge({
    status,
    lockedByUserName,
    className,
}: LockStatusBadgeProps) {
    switch (status) {
        case "loading":
            return (
                <Badge variant="outline" className={className}>
                    <Lock className="mr-1 h-3 w-3 animate-pulse" />
                    Checking lock...
                </Badge>
            );

        case "acquired":
            return (
                <Badge variant="default" className={`bg-green-600 hover:bg-green-700 ${className}`}>
                    <Lock className="mr-1 h-3 w-3" />
                    Editing
                </Badge>
            );

        case "read-only":
            return (
                <Badge variant="secondary" className={className}>
                    <LockOpen className="mr-1 h-3 w-3" />
                    Read-only
                    {lockedByUserName && (
                        <span className="ml-1 text-xs opacity-75">
                            ({lockedByUserName} is editing)
                        </span>
                    )}
                </Badge>
            );

        case "lock-lost":
            return (
                <Badge variant="destructive" className={className}>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Lock Lost
                </Badge>
            );

        case "error":
            return (
                <Badge variant="destructive" className={className}>
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Error
                </Badge>
            );

        default:
            return null;
    }
}
