"use client";

import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISuggestButtonProps {
    onClick: () => void;
    isActive?: boolean;
}

export function AISuggestButton({ onClick, isActive = false }: AISuggestButtonProps) {
    return (
        <TooltipProvider delayDuration={200}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="sm"
                        variant={isActive ? "default" : "secondary"}
                        className={`h-8 w-8 rounded-full shadow-lg border border-border p-0 transition-all duration-200 hover:scale-110 ${isActive ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-white dark:bg-slate-800"
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onClick();
                        }}
                    >
                        <MessageSquarePlus className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                    <p className="text-xs font-medium">Ask AI</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
