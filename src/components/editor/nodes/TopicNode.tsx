"use client";

/**
 * Topic Node Component
 * 
 * Features:
 * - 4 Directional "Quick Add" buttons on hover/selection
 */

import { memo, useState, useRef, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Plus } from "lucide-react";
import { useInteraction } from "../interaction/InteractionContext";
import { type InteractionMode } from "../interaction/InteractionContext";

interface TopicNodeData extends Record<string, unknown> {
    label: string;
    color?: string;
    isEditing?: boolean;
    isSelected?: boolean;
    isSearchMatch?: boolean;
    onLabelChange?: (label: string) => void;
    onAddNode?: (direction: "top" | "right" | "bottom" | "left") => void;

    // Injected by MindMapCanvas
    interactionMode?: InteractionMode;
    isNodeHovered?: boolean;  // NEW: Indicates if THIS specific node is hovered
    isPlusHovered?: boolean;
}

type TopicNodeType = Node<TopicNodeData>;

function TopicNodeComponent({ id, data }: NodeProps<TopicNodeType>) {
    const { actions } = useInteraction();
    const [editValue, setEditValue] = useState(data.label);
    const inputRef = useRef<HTMLInputElement>(null);

    // ... useEffects for editValue ...

    useEffect(() => {
        if (data.isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [data.isEditing]);

    useEffect(() => {
        setEditValue(data.label);
    }, [data.label]);

    const handleBlur = () => {
        if (data.onLabelChange && editValue.trim()) {
            data.onLabelChange(editValue.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleBlur();
        } else if (e.key === "Escape") {
            setEditValue(data.label);
            data.onLabelChange?.(data.label);
        }
    };

    const handleAddClick = (e: React.MouseEvent, direction: "top" | "right" | "bottom" | "left") => {
        e.stopPropagation();
        if (data.onAddNode) {
            data.onAddNode(direction);
        }
    };

    // Explicit Hover Handlers
    const handleMouseEnter = () => actions.hoverNode(id);
    const handleMouseLeave = () => actions.exitNode(id);

    const handlePlusEnter = (e: React.MouseEvent, dir: string) => {
        e.stopPropagation();
        actions.hoverPlus(id, dir);
    };

    const handlePlusLeave = (e: React.MouseEvent) => {
        e.stopPropagation();
        actions.exitPlus(id);
    };

    const bgColor = data.color || "#3b82f6";
    const borderColor = data.isSearchMatch
        ? "#f59e0b"
        : data.isSelected
            ? "#1d4ed8"
            : bgColor;

    const handleClasses = "w-3 h-3 !bg-transparent !border-0 opacity-0 z-50";
    const offset = -6;

    // VISIBILITY LOGIC
    // Only show buttons if THIS node is hovered or selected
    const isNodeHovered = data.isNodeHovered || false;
    const isSelected = data.isSelected;
    const shouldShowButtons = isSelected || isNodeHovered;

    // Layout Logic
    const layout = data.layoutDirection || "LR"; // Default to LR if undefined

    // Determine which buttons to show
    const showTop = shouldShowButtons && (layout === "TB" ? false : layout === "RADIAL" ? true : true);
    const showBottom = shouldShowButtons && (layout === "TB" ? true : layout === "RADIAL" ? true : true);
    const showLeft = shouldShowButtons && (layout === "LR" ? false : layout === "RADIAL" ? true : true);
    const showRight = shouldShowButtons && (layout === "LR" ? true : layout === "RADIAL" ? true : true);

    // If strictly enforcing 1-way flow:
    // TB: Only Bottom? Or Top/Bottom? User said "Parent edges ALWAYS exit from BOTTOM", "Plus (+) button ONLY appears at BOTTOM"
    // LR: Only Right? User said "Plus (+) button ONLY appears on RIGHT"
    // Radial: "Plus (+) button aligns with radial direction" -> Hard to detect "outward" without position context.
    // For Radial, let's keep all 4 or standard 4.

    // strict logic implementation:
    const showBtnTop = shouldShowButtons && layout !== "TB" && layout !== "LR"; // Only in circular/free
    const showBtnBottom = shouldShowButtons && (layout === "TB" || layout === "RADIAL" || !layout);
    const showBtnLeft = shouldShowButtons && layout !== "LR" && layout !== "TB"; // Only in circular/free
    const showBtnRight = shouldShowButtons && (layout === "LR" || layout === "RADIAL" || !layout);

    // Re-evaluating User Request:
    // Vertical: "Plus (+) button ONLY appears at BOTTOM"
    // Horizontal: "Plus (+) button ONLY appears on RIGHT"
    // Radial: "Plus (+) button aligns with radial direction" -> We can't easily know "radial direction" inside Node without passing angle.
    // Let's stick to: TB -> Bottom only. LR -> Right only. Radial -> All 4 (allowing user to branch out).

    const visibleTop = shouldShowButtons && layout === "RADIAL";
    const visibleBottom = shouldShowButtons && (layout === "TB" || layout === "RADIAL");
    const visibleLeft = shouldShowButtons && layout === "RADIAL";
    const visibleRight = shouldShowButtons && (layout === "LR" || layout === "RADIAL");


    // Animation classes
    const containerClasses = `absolute z-50 flex justify-center items-center transition-opacity duration-200 ${shouldShowButtons ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`;
    const buttonClasses = "w-5 h-5 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:scale-110 active:scale-95 text-slate-600 transition-all cursor-pointer nodrag nopan flex items-center justify-center";

    return (
        <div
            className="group relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Standard Handles */}
            <Handle id="top" type="target" position={Position.Top} className={handleClasses} style={{ top: offset }} />
            <Handle id="right" type="source" position={Position.Right} className={handleClasses} style={{ right: offset }} />
            <Handle id="bottom" type="source" position={Position.Bottom} className={handleClasses} style={{ bottom: offset }} />
            <Handle id="left" type="target" position={Position.Left} className={handleClasses} style={{ left: offset }} />

            {/* Complementary Handles for Radial Layout flexibility */}
            <Handle id="top-source" type="source" position={Position.Top} className={handleClasses} style={{ top: offset }} />
            <Handle id="right-target" type="target" position={Position.Right} className={handleClasses} style={{ right: offset }} />
            <Handle id="bottom-target" type="target" position={Position.Bottom} className={handleClasses} style={{ bottom: offset }} />
            <Handle id="left-source" type="source" position={Position.Left} className={handleClasses} style={{ left: offset }} />

            <div
                className={`px-6 py-3 rounded-xl shadow-lg transition-all ${data.isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""
                    } ${data.isSearchMatch ? "ring-2 ring-offset-2 ring-amber-500" : ""}`}
                style={{
                    backgroundColor: bgColor,
                    borderColor: borderColor,
                    borderWidth: 3,
                    minWidth: 120,
                    position: 'relative',
                    zIndex: 20, // Strict Z-Index
                }}
            >
                {data.isEditing ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        className="bg-transparent text-white text-center font-semibold text-lg w-full outline-none"
                        style={{ minWidth: 100 }}
                    />
                ) : (
                    <div className="text-white font-semibold text-lg text-center">
                        {data.label}
                    </div>
                )}
            </div>

            {/* Quick Add Button Containers */}
            {/* Top */}
            {visibleTop && (
                <div
                    className={`${containerClasses} -top-8 left-1/2 -translate-x-1/2 w-12 h-10 pb-2 items-start`}
                    onMouseEnter={(e) => handlePlusEnter(e, "top")}
                    onMouseLeave={handlePlusLeave}
                >
                    <button onClick={(e) => handleAddClick(e, "top")} className={buttonClasses} title="Add Top">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Bottom */}
            {visibleBottom && (
                <div
                    className={`${containerClasses} -bottom-8 left-1/2 -translate-x-1/2 w-12 h-10 pt-2 items-end`}
                    onMouseEnter={(e) => handlePlusEnter(e, "bottom")}
                    onMouseLeave={handlePlusLeave}
                >
                    <button onClick={(e) => handleAddClick(e, "bottom")} className={buttonClasses} title="Add Bottom">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Left */}
            {visibleLeft && (
                <div
                    className={`${containerClasses} top-1/2 -left-8 -translate-y-1/2 w-10 h-12 pr-2 justify-start`}
                    onMouseEnter={(e) => handlePlusEnter(e, "left")}
                    onMouseLeave={handlePlusLeave}
                >
                    <button onClick={(e) => handleAddClick(e, "left")} className={buttonClasses} title="Add Left">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}

            {/* Right */}
            {visibleRight && (
                <div
                    className={`${containerClasses} top-1/2 -right-8 -translate-y-1/2 w-10 h-12 pl-2 justify-end`}
                    onMouseEnter={(e) => handlePlusEnter(e, "right")}
                    onMouseLeave={handlePlusLeave}
                >
                    <button onClick={(e) => handleAddClick(e, "right")} className={buttonClasses} title="Add Right">
                        <Plus className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}

export const TopicNode = memo(TopicNodeComponent);
