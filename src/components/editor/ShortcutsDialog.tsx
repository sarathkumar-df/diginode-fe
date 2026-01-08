"use client";

/**
 * Keyboard Shortcuts Dialog
 * 
 * Modal showing all available keyboard shortcuts.
 */

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const SHORTCUTS = [
    {
        category: "Nodes", shortcuts: [
            { keys: ["T"], description: "Add Topic node" },
            { keys: ["I"], description: "Add Idea node" },
            { keys: ["N"], description: "Add Note node" },
            { keys: ["Delete"], description: "Delete selected" },
            { keys: ["Enter"], description: "Edit selected node" },
            { keys: ["Escape"], description: "Cancel/Deselect" },
        ]
    },
    {
        category: "Edit", shortcuts: [
            { keys: ["Ctrl", "Z"], description: "Undo" },
            { keys: ["Ctrl", "Y"], description: "Redo" },
            { keys: ["Ctrl", "C"], description: "Copy" },
            { keys: ["Ctrl", "V"], description: "Paste" },
            { keys: ["Ctrl", "D"], description: "Duplicate" },
        ]
    },
    {
        category: "View", shortcuts: [
            { keys: ["Ctrl", "F"], description: "Search" },
            { keys: ["Ctrl", "E"], description: "Export" },
            { keys: ["+"], description: "Zoom in" },
            { keys: ["-"], description: "Zoom out" },
            { keys: ["0"], description: "Fit to view" },
        ]
    },
    {
        category: "General", shortcuts: [
            { keys: ["Ctrl", "S"], description: "Save" },
            { keys: ["?"], description: "Show shortcuts" },
            { keys: ["C"], description: "Color picker" },
        ]
    },
];

export function ShortcutsDialog({ open, onOpenChange }: ShortcutsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Keyboard Shortcuts</DialogTitle>
                    <DialogDescription>
                        Quick actions to speed up your workflow
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {SHORTCUTS.map((section) => (
                        <div key={section.category}>
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.shortcuts.map((shortcut, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between"
                                    >
                                        <span className="text-sm">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex gap-1">
                                            {shortcut.keys.map((key, keyIdx) => (
                                                <kbd
                                                    key={keyIdx}
                                                    className="px-2 py-1 text-xs font-mono bg-muted rounded border"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
