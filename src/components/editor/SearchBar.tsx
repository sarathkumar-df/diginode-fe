"use client";

/**
 * Search Bar Component
 * 
 * Search and filter nodes in the mind map.
 */

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, ChevronUp, ChevronDown } from "lucide-react";

interface SearchBarProps {
    open: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onNavigate: (direction: "next" | "prev") => void;
    matchCount: number;
    currentMatch: number;
}

export function SearchBar({
    open,
    onClose,
    onSearch,
    onNavigate,
    matchCount,
    currentMatch,
}: SearchBarProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            inputRef.current?.focus();
        } else {
            setQuery("");
        }
    }, [open]);

    useEffect(() => {
        onSearch(query);
    }, [query, onSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onClose();
        } else if (e.key === "Enter") {
            if (e.shiftKey) {
                onNavigate("prev");
            } else {
                onNavigate("next");
            }
        }
    };

    if (!open) return null;

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl border p-2">
            <Input
                ref={inputRef}
                type="text"
                placeholder="Search nodes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-64"
            />

            {query && (
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {matchCount > 0 ? `${currentMatch} of ${matchCount}` : "No matches"}
                </span>
            )}

            <div className="flex gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("prev")}
                    disabled={matchCount === 0}
                    className="h-8 w-8"
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onNavigate("next")}
                    disabled={matchCount === 0}
                    className="h-8 w-8"
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}
