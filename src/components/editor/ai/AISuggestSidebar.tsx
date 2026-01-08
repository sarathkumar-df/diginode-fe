"use client";

import { X, Plus, Sparkles, Lightbulb, StickyNote, CircleDot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AISuggestionsResponse } from "@/lib/validation";

interface AISuggestSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    suggestions: AISuggestionsResponse["suggestions"];
    isGenerating: boolean;
    onAddSuggestion: (suggestion: AISuggestionsResponse["suggestions"][0]) => void;
}

export function AISuggestSidebar({
    isOpen,
    onClose,
    suggestions,
    isGenerating,
    onAddSuggestion,
}: AISuggestSidebarProps) {
    if (!isOpen) return null;

    const getIcon = (type: string) => {
        switch (type) {
            case "topic": return <CircleDot className="h-4 w-4 text-blue-500" />;
            case "note": return <StickyNote className="h-4 w-4 text-green-500" />;
            default: return <Lightbulb className="h-4 w-4 text-amber-500" />;
        }
    };

    return (
        <div className="fixed right-0 top-[53px] bottom-0 w-[400px] z-40 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-semibold">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    AI Suggestions
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                        <div className="relative">
                            <div className="h-12 w-12 rounded-full border-4 border-slate-100 dark:border-slate-800" />
                            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-700 dark:text-slate-200">Generating Ideas...</p>
                            <p className="text-sm text-slate-500">Analyzing your map context</p>
                        </div>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2 text-center text-slate-500">
                        <Lightbulb className="h-8 w-8 text-slate-300 mb-2" />
                        <p>No suggestions yet.</p>
                        <p className="text-sm">Select a node and ask AI for help!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={index}
                                className="group relative bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-purple-200 dark:hover:border-purple-800 transition-all hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                    <div className="flex items-center gap-2">
                                        {getIcon(suggestion.type)}
                                        <span className="font-medium text-slate-900 dark:text-slate-100">
                                            {suggestion.label}
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] capitalize">
                                        {suggestion.type}
                                    </Badge>
                                </div>

                                {suggestion.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                        {suggestion.description}
                                    </p>
                                )}

                                {suggestion.reasoning && (
                                    <div className="text-xs text-slate-500 bg-white dark:bg-slate-900/50 rounded p-2 mb-3">
                                        <span className="font-medium text-slate-600 dark:text-slate-400">Why: </span>
                                        {suggestion.reasoning}
                                    </div>
                                )}

                                <Button
                                    size="sm"
                                    className="w-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-purple-300 hover:text-purple-600 transition-colors group-hover:visible"
                                    onClick={() => onAddSuggestion(suggestion)}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-2" />
                                    Add to Map
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
