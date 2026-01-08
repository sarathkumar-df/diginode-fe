"use client";

/**
 * Lock Lost Modal Component
 * 
 * Displays when the user's lock has been stolen by another user.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface LockLostModalProps {
    open: boolean;
    onRefresh: () => void;
    onViewReadOnly: () => void;
}

export function LockLostModal({
    open,
    onRefresh,
    onViewReadOnly,
}: LockLostModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Session Expired
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        Your editing session has expired and was taken over by another user.
                        Any unsaved changes may be lost.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        This happens when your connection was inactive for more than 60 seconds.
                        To continue editing, you&apos;ll need to refresh the page and re-acquire
                        the lock.
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={onViewReadOnly}>
                        Continue in Read-Only
                    </Button>
                    <Button onClick={onRefresh}>
                        Refresh Page
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
