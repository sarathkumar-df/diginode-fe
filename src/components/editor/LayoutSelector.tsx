"use client";

import { LayoutPanelLeft, ArrowDown, Network } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LayoutDirection } from "@/lib/layout";

interface LayoutSelectorProps {
    onLayoutChange: (direction: LayoutDirection) => void;
    isLayouting?: boolean;
}

export function LayoutSelector({ onLayoutChange, isLayouting = false }: LayoutSelectorProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isLayouting}>
                    <LayoutPanelLeft className="mr-2 h-4 w-4" />
                    Layout
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLayoutChange("LR")}>
                    <LayoutPanelLeft className="mr-2 h-4 w-4" />
                    Horizontal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLayoutChange("TB")}>
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Vertical
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onLayoutChange("RADIAL")}>
                    <Network className="mr-2 h-4 w-4" />
                    Star View
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
