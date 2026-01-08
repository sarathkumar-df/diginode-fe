"use client";

/**
 * Context Menu Component
 * 
 * Right-click context menu for nodes.
 */

import { useEffect, useRef } from "react";
import {
    Copy,
    Trash2,
    Edit3,
    Palette,
    Link,
    Unlink
} from "lucide-react";

interface ContextMenuProps {
    x: number;
    y: number;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onChangeColor: () => void;
    onAddConnection?: () => void;
    onRemoveConnections?: () => void;
    hasConnections?: boolean;
}

export function ContextMenu({
    x,
    y,
    onClose,
    onEdit,
    onDelete,
    onDuplicate,
    onChangeColor,
    onAddConnection,
    onRemoveConnections,
    hasConnections = false,
}: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    const menuItems = [
        { icon: Edit3, label: "Edit", shortcut: "Enter", onClick: onEdit },
        { icon: Copy, label: "Duplicate", shortcut: "Ctrl+D", onClick: onDuplicate },
        { icon: Palette, label: "Change Color", shortcut: "C", onClick: onChangeColor },
        { type: "divider" as const },
        ...(onAddConnection ? [{ icon: Link, label: "Add Connection", onClick: onAddConnection }] : []),
        ...(hasConnections && onRemoveConnections ? [{ icon: Unlink, label: "Remove Connections", onClick: onRemoveConnections }] : []),
        { type: "divider" as const },
        { icon: Trash2, label: "Delete", shortcut: "Del", onClick: onDelete, danger: true },
    ];

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] bg-white dark:bg-slate-800 rounded-lg shadow-xl border py-1"
            style={{ left: x, top: y }}
        >
            {menuItems.map((item, idx) => {
                if (item.type === "divider") {
                    return <div key={idx} className="border-t my-1" />;
                }

                const Icon = item.icon;
                return (
                    <button
                        key={idx}
                        onClick={() => {
                            item.onClick?.();
                            onClose();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors ${item.danger ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-950" : ""
                            }`}
                    >
                        {Icon && <Icon className="h-4 w-4" />}
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-xs text-muted-foreground">
                                {item.shortcut}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
