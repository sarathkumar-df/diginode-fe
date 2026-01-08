"use client";

/**
 * New Changes Banner Component
 * 
 * Shows when the server version is newer than client version (read-only mode).
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Info } from "lucide-react";

interface NewChangesBannerProps {
    onRefresh: () => void;
}

export function NewChangesBanner({ onRefresh }: NewChangesBannerProps) {
    return (
        <Alert className="rounded-none border-x-0 border-t-0 bg-blue-50 dark:bg-blue-950">
            <Info className="h-4 w-4" />
            <AlertTitle>New changes available</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
                <span>This mind map has been updated. Refresh to see the latest version.</span>
                <Button size="sm" variant="outline" onClick={onRefresh} className="ml-4">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    Refresh
                </Button>
            </AlertDescription>
        </Alert>
    );
}
