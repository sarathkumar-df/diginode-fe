"use client";

/**
 * Editor Toolbar
 * 
 * Photoshop-style command palette toolbar with large icons.
 * Stacked vertically on the left side of the editor.
 */

import { Button } from "@/components/ui/button";
import {
    CircleDot,
    Lightbulb,
    StickyNote,
    Download,
    Undo2,
    Redo2,
    Search,
    Keyboard,
    Palette,
    Plus,
    Edit3,
    Layers
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export type NodeType = "topic" | "idea" | "note";

interface EditorToolbarProps {
    onAddNode: (type: NodeType) => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onExport?: () => void;
    onSearch?: () => void;
    onShowShortcuts?: () => void;
    onToggleColorPicker?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    isReadOnly?: boolean;
    showColorPicker?: boolean;
    selectedNodeColor?: string; // NEW: Current selected node's color for preview
}

export function EditorToolbar({
    onAddNode,
    onUndo,
    onRedo,
    onExport,
    onSearch,
    onShowShortcuts,
    onToggleColorPicker,
    canUndo = false,
    canRedo = false,
    isReadOnly = false,
    showColorPicker = false,
    selectedNodeColor,
}: EditorToolbarProps) {
    // Larger button size for Photoshop-style appearance
    const buttonClasses = "flex-1 max-h-14 min-h-[40px] w-14 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 hover:scale-105";
    const iconClasses = "h-7 w-7";
    const disabledIconClasses = "h-7 w-7 opacity-40";

    return (
        <TooltipProvider delayDuration={200}>
            <div className="fixed left-0 top-[53px] bottom-0 z-10 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 w-[72px] overflow-hidden">

                {/* Section Header - Create */}
                {!isReadOnly && (
                    <>
                        <div className="shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Plus className="h-3.5 w-3.5" />
                                Create
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onAddNode("topic")}
                                        className={buttonClasses}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <CircleDot className={`${iconClasses} text-blue-500`} />
                                            <span className="text-[10px] font-medium text-slate-500">Topic</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Add Topic Node</p>
                                    <p className="text-xs text-muted-foreground">Shortcut: T</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onAddNode("idea")}
                                        className={buttonClasses}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Lightbulb className={`${iconClasses} text-amber-500`} />
                                            <span className="text-[10px] font-medium text-slate-500">Idea</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Add Idea Node</p>
                                    <p className="text-xs text-muted-foreground">Shortcut: I</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onAddNode("note")}
                                        className={buttonClasses}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <StickyNote className={`${iconClasses} text-green-500`} />
                                            <span className="text-[10px] font-medium text-slate-500">Note</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Add Note Node</p>
                                    <p className="text-xs text-muted-foreground">Shortcut: N</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </>
                )}

                {/* Section Header - Edit */}
                {!isReadOnly && (
                    <>
                        <div className="shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Edit3 className="h-3.5 w-3.5" />
                                Edit
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 p-2 border-b border-slate-200 dark:border-slate-700">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={onUndo}
                                        disabled={!canUndo}
                                        className={buttonClasses}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Undo2 className={canUndo ? iconClasses : disabledIconClasses} />
                                            <span className={`text-[10px] font-medium ${canUndo ? 'text-slate-500' : 'text-slate-300'}`}>Undo</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Undo</p>
                                    <p className="text-xs text-muted-foreground">Ctrl + Z</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        onClick={onRedo}
                                        disabled={!canRedo}
                                        className={buttonClasses}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            <Redo2 className={canRedo ? iconClasses : disabledIconClasses} />
                                            <span className={`text-[10px] font-medium ${canRedo ? 'text-slate-500' : 'text-slate-300'}`}>Redo</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Redo</p>
                                    <p className="text-xs text-muted-foreground">Ctrl + Y</p>
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={showColorPicker ? "secondary" : "ghost"}
                                        onClick={onToggleColorPicker}
                                        className={`${buttonClasses} ${showColorPicker ? 'bg-slate-100 dark:bg-slate-700 ring-2 ring-blue-500' : ''}`}
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                            {/* Color Preview Square */}
                                            <div className="relative">
                                                {selectedNodeColor ? (
                                                    <div
                                                        className="h-7 w-7 rounded-lg border-2 border-white shadow-md"
                                                        style={{ backgroundColor: selectedNodeColor }}
                                                    />
                                                ) : (
                                                    <Palette className={`${iconClasses} ${showColorPicker ? 'text-blue-500' : ''}`} />
                                                )}
                                            </div>
                                            <span className="text-[10px] font-medium text-slate-500">Color</span>
                                        </div>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="text-sm">
                                    <p className="font-medium">Color Picker</p>
                                    <p className="text-xs text-muted-foreground">Press C</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </>
                )}

                {/* Section Header - Tools */}
                <div className="shrink-0 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <Layers className="h-3.5 w-3.5" />
                        Tools
                    </div>
                </div>

                <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-1 p-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onSearch}
                                className={buttonClasses}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Search className={iconClasses} />
                                    <span className="text-[10px] font-medium text-slate-500">Search</span>
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-sm">
                            <p className="font-medium">Search Nodes</p>
                            <p className="text-xs text-muted-foreground">Ctrl + F</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onExport}
                                className={buttonClasses}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Download className={iconClasses} />
                                    <span className="text-[10px] font-medium text-slate-500">Export</span>
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-sm">
                            <p className="font-medium">Export as Image</p>
                            <p className="text-xs text-muted-foreground">Ctrl + E</p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={onShowShortcuts}
                                className={buttonClasses}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Keyboard className={iconClasses} />
                                    <span className="text-[10px] font-medium text-slate-500">Keys</span>
                                </div>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-sm">
                            <p className="font-medium">Keyboard Shortcuts</p>
                            <p className="text-xs text-muted-foreground">Press ?</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
            </div>
        </TooltipProvider>
    );
}
