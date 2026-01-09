"use client";

import { X, Plus, Sparkles, CircleDot, Lightbulb, StickyNote, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AISuggestionsResponse } from "@/lib/validation";
import { useState } from "react";

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
    const [addedItems, setAddedItems] = useState<Set<number>>(new Set());

    if (!isOpen) return null;

    const getTypeStyles = (type: string) => {
        switch (type) {
            case "topic": return { bg: "bg-blue-100", text: "text-blue-700", icon: CircleDot };
            case "note": return { bg: "bg-green-100", text: "text-green-700", icon: StickyNote };
            default: return { bg: "bg-amber-100", text: "text-amber-700", icon: Lightbulb };
        }
    };

    const handleAdd = (suggestion: AISuggestionsResponse["suggestions"][0], index: number) => {
        onAddSuggestion(suggestion);
        setAddedItems(prev => new Set(prev).add(index));
    };

    return (
        <div className="fixed right-0 top-[53px] bottom-0 w-[340px] z-40 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    AI Suggestions
                    {suggestions.length > 0 && (
                        <span className="text-xs text-slate-500">({suggestions.length})</span>
                    )}
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3">
                {isGenerating ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-full border-2 border-slate-200 dark:border-slate-700" />
                            <div className="absolute top-0 left-0 h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                        </div>
                        <p className="text-sm text-slate-500">Generating suggestions...</p>
                    </div>
                ) : suggestions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center text-slate-400">
                        <Lightbulb className="h-6 w-6 text-slate-300" />
                        <p className="text-sm">No suggestions yet</p>
                        <p className="text-xs">Select a node and ask AI</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => {
                            const styles = getTypeStyles(suggestion.type);
                            const Icon = styles.icon;
                            const isAdded = addedItems.has(index);

                            return (
                                <div
                                    key={index}
                                    className="group relative rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all"
                                >
                                    <div className="p-3">
                                        {/* Header Row */}
                                        <div className="flex items-start gap-2 mb-1">
                                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${styles.bg} ${styles.text}`}>
                                                <Icon className="h-3 w-3" />
                                                {suggestion.type}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h4 className="font-medium text-sm text-slate-900 dark:text-slate-100 mb-1">
                                            {suggestion.label}
                                        </h4>

                                        {/* Description */}
                                        {suggestion.description && (
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {suggestion.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Add Button - Bottom Right */}
                                    <button
                                        onClick={() => handleAdd(suggestion, index)}
                                        disabled={isAdded}
                                        className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-all ${isAdded
                                            ? "bg-green-100 text-green-700 cursor-default"
                                            : "bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700"
                                            }`}
                                    >
                                        {isAdded ? (
                                            <>
                                                <Check className="h-3 w-3" />
                                                Added
                                            </>
                                        ) : (
                                            <>
                                                <Plus className="h-3 w-3" />
                                                Add
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
}
