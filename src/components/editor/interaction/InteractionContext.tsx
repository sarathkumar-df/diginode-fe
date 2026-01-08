"use client";

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

// ============================================================================
// 1. STATE DEFINITIONS
// ============================================================================

export type InteractionMode =
    | 'IDLE'            // Default state
    | 'NODE_HOVER'      // Hovering a node
    | 'EDGE_HOVER'      // Hovering an edge
    | 'PLUS_HOVER'      // Hovering a plus button
    | 'CONNECTING'      // Dragging to create a connection
    | 'DRAGGING_NODE'   // Moving a node
    | 'PANNING'         // Moving the canvas
    | 'READ_ONLY';      // View only

interface InteractionState {
    mode: InteractionMode;
    hoveredNodeId: string | null;
    hoveredEdgeId: string | null;
    plusBtnDirection: string | null; // e.g., 'top', 'right'
    connectingSourceId: string | null;
}

const initialState: InteractionState = {
    mode: 'IDLE',
    hoveredNodeId: null,
    hoveredEdgeId: null,
    plusBtnDirection: null,
    connectingSourceId: null,
};

// ============================================================================
// 2. ACTIONS
// ============================================================================

type Action =
    | { type: 'HOVER_NODE'; nodeId: string }
    | { type: 'EXIT_NODE'; nodeId: string } // Explicit exit needed for safety
    | { type: 'HOVER_EDGE'; edgeId: string }
    | { type: 'EXIT_EDGE'; edgeId: string }
    | { type: 'HOVER_PLUS'; nodeId: string; direction: string }
    | { type: 'EXIT_PLUS'; nodeId: string }
    | { type: 'START_CONNECTING'; nodeId: string; direction: string }
    | { type: 'END_CONNECTING' }
    | { type: 'START_DRAGGING_NODE'; nodeId: string }
    | { type: 'END_DRAGGING_NODE' }
    | { type: 'START_PANNING' }
    | { type: 'END_PANNING' }
    | { type: 'SET_READ_ONLY'; isReadOnly: boolean }
    | { type: 'RESET_IDLE' };

// ============================================================================
// 3. REDUCER (The Brain)
// ============================================================================

function interactionReducer(state: InteractionState, action: Action): InteractionState {
    // Global Lock: specific modes block everything except their exit condition
    if (state.mode === 'READ_ONLY') {
        if (action.type === 'SET_READ_ONLY' && !action.isReadOnly) {
            return { ...initialState, mode: 'IDLE' };
        }
        // Allow basic hover in read-only? Maybe. For now, strict.
        // Let's allow NODE_HOVER in read-only for info, but no + buttons.
        if (action.type === 'HOVER_NODE') return { ...state, mode: 'NODE_HOVER', hoveredNodeId: action.nodeId };
        if (action.type === 'EXIT_NODE') return { ...state, mode: 'READ_ONLY', hoveredNodeId: null };
        return state;
    }

    switch (action.type) {
        case 'HOVER_NODE':
            // Can enter NODE_HOVER from IDLE or EDGE_HOVER or another NODE_HOVER (fast switch)
            if (['IDLE', 'EDGE_HOVER', 'NODE_HOVER'].includes(state.mode)) {
                return { ...state, mode: 'NODE_HOVER', hoveredNodeId: action.nodeId, hoveredEdgeId: null };
            }
            return state;

        case 'EXIT_NODE':
            if (state.mode === 'NODE_HOVER' && state.hoveredNodeId === action.nodeId) {
                return { ...state, mode: 'IDLE', hoveredNodeId: null };
            }
            return state;

        case 'HOVER_EDGE':
            // Edge hover has Lower Priority.
            // Cannot enter if interacting with Node or Plus button
            if (state.mode === 'IDLE') {
                return { ...state, mode: 'EDGE_HOVER', hoveredEdgeId: action.edgeId };
            }
            return state;

        case 'EXIT_EDGE':
            if (state.mode === 'EDGE_HOVER' && state.hoveredEdgeId === action.edgeId) {
                return { ...state, mode: 'IDLE', hoveredEdgeId: null };
            }
            return state;

        case 'HOVER_PLUS':
            // Plus buttons are "Children" of nodes interactions usually, 
            // but here we treat them as a distinct "Locked" hover state.
            if (['NODE_HOVER', 'PLUS_HOVER'].includes(state.mode)) {
                return {
                    ...state,
                    mode: 'PLUS_HOVER',
                    hoveredNodeId: action.nodeId,
                    plusBtnDirection: action.direction
                };
            }
            return state;

        case 'EXIT_PLUS':
            if (state.mode === 'PLUS_HOVER' && state.hoveredNodeId === action.nodeId) {
                // Return to Node Hover properly, don't drop to IDLE immediately
                // to avoid flicker if mouse is still on node body
                return { ...state, mode: 'NODE_HOVER', plusBtnDirection: null };
            }
            return state;

        case 'START_CONNECTING':
            return {
                ...state,
                mode: 'CONNECTING',
                connectingSourceId: action.nodeId,
                plusBtnDirection: action.direction
            };

        case 'END_CONNECTING':
            return { ...initialState }; // Reset completely

        case 'START_DRAGGING_NODE':
            return { ...state, mode: 'DRAGGING_NODE', hoveredNodeId: action.nodeId };

        case 'END_DRAGGING_NODE':
            // When drag ends, we might still be hovering the node.
            // Ideally we check mouse position, but safely returning to IDLE or NODE_HOVER is okay.
            // Let's bet on Node Hover because mouse is likely still there.
            return { ...state, mode: 'NODE_HOVER' };

        case 'START_PANNING':
            return { ...state, mode: 'PANNING' };

        case 'END_PANNING':
            return { ...state, mode: 'IDLE' };

        case 'SET_READ_ONLY':
            return action.isReadOnly ? { ...initialState, mode: 'READ_ONLY' } : { ...initialState, mode: 'IDLE' };

        case 'RESET_IDLE':
            return { ...initialState };

        default:
            return state;
    }
}

// ============================================================================
// 4. CONTEXT SETUP
// ============================================================================

interface InteractionContextValue {
    state: InteractionState;
    dispatch: React.Dispatch<Action>;
    actions: {
        hoverNode: (id: string) => void;
        exitNode: (id: string) => void;
        hoverEdge: (id: string) => void;
        exitEdge: (id: string) => void;
        hoverPlus: (nodeId: string, dir: string) => void;
        exitPlus: (nodeId: string) => void;
        startConnecting: (nodeId: string, dir: string) => void;
        endConnecting: () => void;
        startDraggingNode: (id: string) => void;
        endDraggingNode: () => void;
        startPanning: () => void;
        endPanning: () => void;
        reset: () => void;
    }
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function InteractionProvider({ children, isReadOnly = false }: { children: React.ReactNode, isReadOnly?: boolean }) {
    const [state, dispatch] = useReducer(interactionReducer, {
        ...initialState,
        mode: isReadOnly ? 'READ_ONLY' : 'IDLE'
    });

    // Helper actions to keep callsites clean
    const actions = useMemo(() => ({
        hoverNode: (id: string) => dispatch({ type: 'HOVER_NODE', nodeId: id }),
        exitNode: (id: string) => dispatch({ type: 'EXIT_NODE', nodeId: id }),
        hoverEdge: (id: string) => dispatch({ type: 'HOVER_EDGE', edgeId: id }),
        exitEdge: (id: string) => dispatch({ type: 'EXIT_EDGE', edgeId: id }),
        hoverPlus: (nodeId: string, dir: string) => dispatch({ type: 'HOVER_PLUS', nodeId, direction: dir }),
        exitPlus: (nodeId: string) => dispatch({ type: 'EXIT_PLUS', nodeId }),
        startConnecting: (nodeId: string, dir: string) => dispatch({ type: 'START_CONNECTING', nodeId, direction: dir }),
        endConnecting: () => dispatch({ type: 'END_CONNECTING' }),
        startDraggingNode: (id: string) => dispatch({ type: 'START_DRAGGING_NODE', nodeId: id }),
        endDraggingNode: () => dispatch({ type: 'END_DRAGGING_NODE' }),
        startPanning: () => dispatch({ type: 'START_PANNING' }),
        endPanning: () => dispatch({ type: 'END_PANNING' }),
        reset: () => dispatch({ type: 'RESET_IDLE' }),
    }), []);

    // Sync ReadOnly props
    React.useEffect(() => {
        dispatch({ type: 'SET_READ_ONLY', isReadOnly });
    }, [isReadOnly]);

    return (
        <InteractionContext.Provider value={{ state, dispatch, actions }}>
            {children}
        </InteractionContext.Provider>
    );
}

export function useInteraction() {
    const context = useContext(InteractionContext);
    if (!context) {
        throw new Error("useInteraction must be used within an InteractionProvider");
    }
    return context;
}
