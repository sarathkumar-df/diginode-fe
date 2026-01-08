"use client";

import React, { memo, useState } from 'react';
import { BaseEdge, type EdgeProps, getBezierPath, EdgeLabelRenderer, Position } from '@xyflow/react';

/**
 * CustomEdge Component
 * 
 * Strategy for Gap-Free Connections:
 * 1. The logical handles (on Nodes) are on the border.
 * 2. This edge receives those border coordinates (sourceX, targetX).
 * 3. We calculate "inner" coordinates that are ~10px INSIDE the node relative to the border.
 * 4. We draw the Bezier path to these INNER coordinates (so the line looks like it goes in).
 * 5. We render the interactive/visual DOTS at the original BORDER coordinates.
 */

const EDGE_INSET = 10; // How deep the line goes into the node

const getInnerPosition = (x: number, y: number, position: Position) => {
    switch (position) {
        case Position.Left:
            return { x: x + EDGE_INSET, y };
        case Position.Right:
            return { x: x - EDGE_INSET, y };
        case Position.Top:
            return { x, y: y + EDGE_INSET };
        case Position.Bottom:
            return { x, y: y - EDGE_INSET };
        default:
            return { x, y };
    }
}

const CustomEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
}: EdgeProps) => {
    const [isHovered, setIsHovered] = useState(false);

    // Calculate path points (extended inside the nodes)
    const sourceInner = getInnerPosition(sourceX, sourceY, sourcePosition);
    const targetInner = getInnerPosition(targetX, targetY, targetPosition);

    const [edgePath] = getBezierPath({
        sourceX: sourceInner.x,
        sourceY: sourceInner.y,
        sourcePosition,
        targetX: targetInner.x,
        targetY: targetInner.y,
        targetPosition,
    });

    // Show handles if selected OR hovered
    const showHandles = selected || isHovered;

    return (
        <>
            <g
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <BaseEdge
                    id={id}
                    path={edgePath}
                    // Remove markerEnd to prevent arrow sitting inside node? 
                    // Or keep it? If path ends inside, arrow ends inside.
                    // Usually mind maps don't use arrows, but if they do, they might be hidden.
                    // For now, pass it through.
                    markerEnd={markerEnd}
                    style={{
                        ...style,
                        stroke: selected ? '#3b82f6' : (style.stroke || '#64748b'),
                        strokeWidth: selected ? 3 : 2,
                    }}
                    interactionWidth={20}
                />
            </g>

            {/* 
        Render handles at the ORIGINAL (Border) coordinates.
        This ensures they sit on the edge as expected.
      */}
            <EdgeLabelRenderer>
                {/* Source Handle */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${sourceX}px,${sourceY}px)`,
                        zIndex: 1000,
                        opacity: showHandles ? 1 : 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: showHandles ? 'all' : 'none',
                        cursor: 'pointer',
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className={`w-3 h-3 rounded-full border-2 bg-white ${selected ? 'border-blue-500' : 'border-slate-500'}`} />
                </div>

                {/* Target Handle */}
                <div
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${targetX}px,${targetY}px)`,
                        zIndex: 1000,
                        opacity: showHandles ? 1 : 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: showHandles ? 'all' : 'none',
                        cursor: 'pointer',
                    }}
                    className="nodrag nopan"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                >
                    <div className={`w-3 h-3 rounded-full border-2 bg-white ${selected ? 'border-blue-500' : 'border-slate-500'}`} />
                </div>
            </EdgeLabelRenderer>
        </>
    );
};

export default memo(CustomEdge);
