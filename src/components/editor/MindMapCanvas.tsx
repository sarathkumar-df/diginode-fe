"use client";

/**
 * Mind Map Canvas Component
 * 
 * React Flow-based canvas for the mind map editor.
 * Features:
 * - Custom node types (Topic, Idea, Note)
 * - Inline editing
 * - Undo/Redo
 * - Keyboard shortcuts
 * - Context menu
 * - Search
 * - Export
 */

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
    ReactFlow,
    Node,
    Edge,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    MiniMap,
    Background,
    BackgroundVariant,
    NodeTypes,
    useReactFlow,
    ReactFlowProvider,
    getNodesBounds,
    getViewportForBounds,
    NodeToolbar,
    Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { TopicNode } from "./nodes/TopicNode";
import { IdeaNode } from "./nodes/IdeaNode";
import { NoteNode } from "./nodes/NoteNode";
import { EditorToolbar, NodeType } from "./EditorToolbar";
import { ColorPicker } from "./ColorPicker";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { SearchBar } from "./SearchBar";
import { ContextMenu } from "./ContextMenu";
import CustomEdge from "./edges/CustomEdge";

import { AISuggestButton } from "./ai/AISuggestButton";
import { AIPromptInput } from "./ai/AIPromptInput";
import { AISuggestSidebar } from "./ai/AISuggestSidebar";
import { generateSuggestions } from "@/lib/actions/ai";
import type { AISuggestionsResponse } from "@/lib/validation";
import type { MindMapContent, MindMapNode, MindMapEdge, MindMapNodeData } from "@/lib/types/mindmap";
import { toPng } from "html-to-image";
import { toast } from "sonner";

// =============================================================================
// CONSTANTS
// =============================================================================

const NODE_TYPES: NodeTypes = {
    topic: TopicNode,
    idea: IdeaNode,
    note: NoteNode,
};

const EDGE_TYPES = {
    default: CustomEdge,
};

const DEFAULT_NODE_COLORS: Record<NodeType, string> = {
    topic: "#3b82f6",
    idea: "#eab308",
    note: "#22c55e",
};

const MAX_HISTORY = 50;

// =============================================================================
// COMPONENT
// =============================================================================

interface MindMapCanvasProps {
    content: MindMapContent;
    onContentChange: (content: MindMapContent) => void;
    isReadOnly: boolean;
}

// ... imports
import { InteractionProvider, useInteraction } from "./interaction/InteractionContext";

// (No content needed, just removing the lines)

function MindMapCanvasInner({
    content,
    onContentChange,
    isReadOnly,
}: MindMapCanvasProps) {
    const reactFlowInstance = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { state: interactionState, actions: interactionActions } = useInteraction();

    // State
    const [nodes, setNodes, onNodesChange] = useNodesState(content.nodes as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState(content.edges as Edge[]);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    // UI State
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchMatches, setSearchMatches] = useState<string[]>([]);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

    // AI State
    const [showAIPrompt, setShowAIPrompt] = useState(false);
    const [showAISidebar, setShowAISidebar] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<AISuggestionsResponse["suggestions"]>([]);

    // History for Undo/Redo
    const historyRef = useRef<{ nodes: Node[]; edges: Edge[] }[]>([]);
    const historyIndexRef = useRef(-1);
    const isUndoRedoRef = useRef(false);

    // ==========================================================================
    // SYNC CONTENT FROM PROPS
    // ==========================================================================
    useEffect(() => {
        if (isUndoRedoRef.current) {
            isUndoRedoRef.current = false;
            return;
        }
        setNodes(content.nodes as Node[]);
        // Force all edges to be solid
        const solidEdges = (content.edges as Edge[]).map(e => ({
            ...e,
            type: "default",
            animated: false,
            style: { ...e.style, strokeDasharray: "0", stroke: "#64748b", strokeWidth: 2 }
        }));
        setEdges(solidEdges);
    }, [content, setNodes, setEdges]);

    // ==========================================================================
    // SAVE TO HISTORY
    // ==========================================================================
    const saveToHistory = useCallback(() => {
        const currentState = { nodes: [...nodes], edges: [...edges] };

        // Remove any future history if we're not at the end
        if (historyIndexRef.current < historyRef.current.length - 1) {
            historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
        }

        // Add current state
        historyRef.current.push(currentState);

        // Limit history size
        if (historyRef.current.length > MAX_HISTORY) {
            historyRef.current.shift();
        }

        historyIndexRef.current = historyRef.current.length - 1;
    }, [nodes, edges]);

    // ==========================================================================
    // NOTIFY PARENT OF CHANGES
    // ==========================================================================
    const notifyChange = useCallback((newNodes: Node[], newEdges: Edge[]) => {
        if (isReadOnly) return;

        onContentChange({
            ...content,
            nodes: newNodes as MindMapNode[],
            edges: newEdges as MindMapEdge[],
        });
    }, [content, onContentChange, isReadOnly]);

    // ==========================================================================
    // HANDLE NODE CHANGES
    // ==========================================================================
    const handleNodesChange = useCallback((changes: Parameters<typeof onNodesChange>[0]) => {
        if (isReadOnly) return;
        onNodesChange(changes);
    }, [isReadOnly, onNodesChange]);

    // ==========================================================================
    // HANDLE EDGE CHANGES
    // ==========================================================================
    const handleEdgesChange = useCallback((changes: Parameters<typeof onEdgesChange>[0]) => {
        if (isReadOnly) return;
        onEdgesChange(changes);
    }, [isReadOnly, onEdgesChange]);

    // ==========================================================================
    // HANDLE CONNECTIONS & RECONNECTIONS
    // ==========================================================================
    const onConnect = useCallback(
        (params: Connection) => {
            if (isReadOnly) return;
            saveToHistory();

            const newEdges = addEdge({
                ...params,
                type: "default",
                style: { stroke: "#64748b", strokeWidth: 2 },
                animated: false,
            }, edges);

            setEdges(newEdges);
            notifyChange(nodes, newEdges);
        },
        [isReadOnly, setEdges, nodes, notifyChange, saveToHistory, edges]
    );

    const onReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) => {
            if (isReadOnly) return;
            saveToHistory();

            const newEdges = edges.map((el) => {
                if (el.id === oldEdge.id) {
                    // Update edge with new source/target
                    return {
                        ...el,
                        source: newConnection.source || el.source,
                        target: newConnection.target || el.target,
                        sourceHandle: newConnection.sourceHandle,
                        targetHandle: newConnection.targetHandle
                    };
                }
                return el;
            });

            setEdges(newEdges);
            notifyChange(nodes, newEdges);
        },
        [isReadOnly, setEdges, nodes, notifyChange, saveToHistory, edges]
    );

    // ==========================================================================
    // ADD NODE
    // ==========================================================================
    const handleAddNode = useCallback((type: NodeType) => {
        if (isReadOnly) return;

        saveToHistory();

        const selectedNode = selectedNodeId
            ? nodes.find(n => n.id === selectedNodeId)
            : null;

        const newNodeId = `${type}-${Date.now()}`;
        const position = selectedNode
            ? {
                x: selectedNode.position.x + 200,
                y: selectedNode.position.y + 50
            }
            : { x: 400, y: 300 };

        const newNode: Node = {
            id: newNodeId,
            type,
            position,
            data: {
                label: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
                color: DEFAULT_NODE_COLORS[type],
            },
        };

        const newNodes = [...nodes, newNode];
        let newEdges = edges;

        // Connect to selected node if exists
        if (selectedNode) {
            const newEdge: Edge = {
                id: `edge-${selectedNode.id}-${newNodeId}`,
                source: selectedNode.id,
                target: newNodeId,
                type: "default",
                style: { stroke: "#64748b", strokeWidth: 2 },
                animated: false,
            };
            newEdges = [...edges, newEdge];
            setEdges(newEdges);
        }

        setNodes(newNodes);
        setSelectedNodeId(newNodeId);
        notifyChange(newNodes, newEdges);

        // Start editing immediately
        setTimeout(() => setEditingNodeId(newNodeId), 100);
    }, [isReadOnly, nodes, edges, selectedNodeId, setNodes, setEdges, notifyChange, saveToHistory]);

    // ==========================================================================
    // DELETE SELECTED NODES
    // ==========================================================================
    const handleDeleteSelected = useCallback(() => {
        if (isReadOnly || !selectedNodeId) return;

        saveToHistory();

        const newNodes = nodes.filter(n => n.id !== selectedNodeId);
        const newEdges = edges.filter(
            e => e.source !== selectedNodeId && e.target !== selectedNodeId
        );

        setNodes(newNodes);
        setEdges(newEdges);
        setSelectedNodeId(null);
        notifyChange(newNodes, newEdges);
    }, [isReadOnly, selectedNodeId, nodes, edges, setNodes, setEdges, notifyChange, saveToHistory]);

    // ==========================================================================
    // UPDATE NODE LABEL
    // ==========================================================================
    const handleUpdateNodeLabel = useCallback((nodeId: string, newLabel: string) => {
        if (isReadOnly) return;

        saveToHistory();

        const newNodes = nodes.map(n =>
            n.id === nodeId
                ? { ...n, data: { ...n.data, label: newLabel } }
                : n
        );

        setNodes(newNodes);
        setEditingNodeId(null);
        notifyChange(newNodes, edges);
    }, [isReadOnly, nodes, edges, setNodes, notifyChange, saveToHistory]);

    // ==========================================================================
    // UPDATE NODE COLOR
    // ==========================================================================
    const handleUpdateNodeColor = useCallback((color: string) => {
        if (isReadOnly || !selectedNodeId) return;

        saveToHistory();

        const newNodes = nodes.map(n =>
            n.id === selectedNodeId
                ? { ...n, data: { ...n.data, color } }
                : n
        );

        setNodes(newNodes);
        notifyChange(newNodes, edges);
    }, [isReadOnly, selectedNodeId, nodes, edges, setNodes, notifyChange, saveToHistory]);

    // ==========================================================================
    // DUPLICATE NODE
    // ==========================================================================
    const handleDuplicateNode = useCallback(() => {
        if (isReadOnly || !selectedNodeId) return;

        const nodeToDuplicate = nodes.find(n => n.id === selectedNodeId);
        if (!nodeToDuplicate) return;

        saveToHistory();

        const newNodeId = `${nodeToDuplicate.type}-${Date.now()}`;
        const newNode: Node = {
            ...nodeToDuplicate,
            id: newNodeId,
            position: {
                x: nodeToDuplicate.position.x + 50,
                y: nodeToDuplicate.position.y + 50,
            },
            data: { ...nodeToDuplicate.data },
        };

        const newNodes = [...nodes, newNode];
        setNodes(newNodes);
        setSelectedNodeId(newNodeId);
        notifyChange(newNodes, edges);
    }, [isReadOnly, selectedNodeId, nodes, edges, setNodes, notifyChange, saveToHistory]);

    // ==========================================================================
    // UNDO / REDO
    // ==========================================================================
    const handleUndo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;

        isUndoRedoRef.current = true;
        historyIndexRef.current--;
        const state = historyRef.current[historyIndexRef.current];

        setNodes(state.nodes);
        setEdges(state.edges);
        notifyChange(state.nodes, state.edges);
    }, [setNodes, setEdges, notifyChange]);

    const handleRedo = useCallback(() => {
        if (historyIndexRef.current >= historyRef.current.length - 1) return;

        isUndoRedoRef.current = true;
        historyIndexRef.current++;
        const state = historyRef.current[historyIndexRef.current];

        setNodes(state.nodes);
        setEdges(state.edges);
        notifyChange(state.nodes, state.edges);
    }, [setNodes, setEdges, notifyChange]);

    // ==========================================================================
    // EXPORT AS IMAGE
    // ==========================================================================
    const handleExport = useCallback(async () => {
        if (!reactFlowWrapper.current) return;

        try {
            const nodesBounds = getNodesBounds(nodes);
            const viewport = getViewportForBounds(
                nodesBounds,
                1200,
                800,
                0.5,
                2,
                0.1
            );

            const dataUrl = await toPng(
                document.querySelector(".react-flow__viewport") as HTMLElement,
                {
                    backgroundColor: "#ffffff",
                    width: 1200,
                    height: 800,
                    style: {
                        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                    },
                }
            );

            const link = document.createElement("a");
            link.download = "mindmap.png";
            link.href = dataUrl;
            link.click();

            toast.success("Exported successfully!");
        } catch (err) {
            console.error("Export failed:", err);
            toast.error("Failed to export image");
        }
    }, [nodes]);

    // ==========================================================================
    // SEARCH
    // ==========================================================================
    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchMatches([]);
            setCurrentMatchIndex(0);
            return;
        }

        const matches = nodes
            .filter(n => (n.data as { label?: string }).label?.toLowerCase().includes(query.toLowerCase()))
            .map(n => n.id);

        setSearchMatches(matches);
        setCurrentMatchIndex(matches.length > 0 ? 1 : 0);

        // Focus first match
        if (matches.length > 0) {
            const node = nodes.find(n => n.id === matches[0]);
            if (node) {
                reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 300 });
                setSelectedNodeId(matches[0]);
            }
        }
    }, [nodes, reactFlowInstance]);

    const handleSearchNavigate = useCallback((direction: "next" | "prev") => {
        if (searchMatches.length === 0) return;

        let newIndex = currentMatchIndex;
        if (direction === "next") {
            newIndex = currentMatchIndex >= searchMatches.length ? 1 : currentMatchIndex + 1;
        } else {
            newIndex = currentMatchIndex <= 1 ? searchMatches.length : currentMatchIndex - 1;
        }

        setCurrentMatchIndex(newIndex);

        const nodeId = searchMatches[newIndex - 1];
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            reactFlowInstance.setCenter(node.position.x, node.position.y, { zoom: 1.5, duration: 300 });
            setSelectedNodeId(nodeId);
        }
    }, [searchMatches, currentMatchIndex, nodes, reactFlowInstance]);

    // ==========================================================================
    // AI HANDLERS
    // ==========================================================================
    const handleAIPromptSubmit = useCallback(async (prompt: string, persona: string = "general") => {
        if (!selectedNodeId) return;

        const selectedNode = nodes.find(n => n.id === selectedNodeId);
        if (!selectedNode) return;

        setShowAIPrompt(false);
        setShowAISidebar(true);
        setIsGeneratingAI(true);
        setAiSuggestions([]);

        try {
            const result = await generateSuggestions({
                nodeText: selectedNode.data.label as string,
                userPrompt: prompt,
                context: (selectedNode.data.description as string) || undefined,
                persona: persona as "general" | "digital_media" | "ui_ux" | "development" | "testing" | "product_management" | "marketing" | "data_analytics",
            });

            if (result.success) {
                setAiSuggestions(result.data.suggestions);
                toast.success("Suggestions generated!");
            } else {
                toast.error(result.error.message);
                setShowAISidebar(false);
            }
        } catch (error) {
            toast.error("Failed to generate suggestions");
            setShowAISidebar(false);
        } finally {
            setIsGeneratingAI(false);
        }
    }, [selectedNodeId, nodes]);

    const handleAddSuggestion = useCallback((suggestion: AISuggestionsResponse["suggestions"][0]) => {
        if (!selectedNodeId || isReadOnly) return;

        saveToHistory();

        const parentNode = nodes.find(n => n.id === selectedNodeId);
        if (!parentNode) return;

        // Determine layout from parent
        const layout = (parentNode.data as any).layoutDirection || "LR";

        // Determine new position based on layout
        let x = parentNode.position.x;
        let y = parentNode.position.y;

        // This effectively simulates "adding to the right" or "adding to the bottom" or "radial"
        // For TB: Add to bottom
        // For LR: Add to right
        // For Radial: Random angle (existing logic) or find a free spot

        const OFFSET_X = 250;
        const OFFSET_Y = 150;

        // Default handle config
        let sourceHandle = "bottom";
        let targetHandle = "top";

        if (layout === "TB") {
            y += OFFSET_Y;
            sourceHandle = "bottom";
            targetHandle = "top";
        } else if (layout === "LR") {
            x += OFFSET_X;
            sourceHandle = "right";
            targetHandle = "left";
        } else {
            // Star/Radial: Randomize for now, but use new handles
            const angle = Math.random() * Math.PI * 2;
            const radius = 250;
            x += Math.cos(angle) * radius;
            y += Math.sin(angle) * radius;

            // For Radial, we use standard logic or just let the layout engine fix it later.
            // But we should pick reasonable handles.
            sourceHandle = "bottom";
            targetHandle = "top";
        }

        const newNodeId = `${suggestion.type}-${Date.now()}`;
        const newNode: Node = {
            id: newNodeId,
            type: suggestion.type,
            position: { x, y },
            data: {
                label: suggestion.label,
                description: suggestion.description,
                color: DEFAULT_NODE_COLORS[suggestion.type] || DEFAULT_NODE_COLORS.idea,
                layoutDirection: layout, // Inherit layout
            },
            // Set initial handles based on layout
            sourcePosition: layout === "TB" ? Position.Bottom : (layout === "LR" ? Position.Right : Position.Bottom),
            targetPosition: layout === "TB" ? Position.Top : (layout === "LR" ? Position.Left : Position.Top),
        };

        const newEdge: Edge = {
            id: `edge-${parentNode.id}-${newNodeId}`,
            source: parentNode.id,
            target: newNodeId,
            sourceHandle, // Set explicit handles
            targetHandle,
            type: "default",
            style: { stroke: "#64748b", strokeWidth: 2 },
            animated: false,
        };

        const newNodes = [...nodes, newNode];
        const newEdges = [...edges, newEdge];

        setNodes(newNodes);
        setEdges(newEdges);
        notifyChange(newNodes, newEdges);

        toast.success(`Added "${suggestion.label}"`);
    }, [selectedNodeId, nodes, edges, isReadOnly, saveToHistory, setNodes, setEdges, notifyChange]);

    // ==========================================================================
    // KEYBOARD SHORTCUTS
    // ==========================================================================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't handle if typing in input
            if ((e.target as HTMLElement).tagName === "INPUT" ||
                (e.target as HTMLElement).tagName === "TEXTAREA") {
                if (e.key === "Escape") {
                    setEditingNodeId(null);
                }
                return;
            }

            // Mod key shortcuts
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case "z":
                        e.preventDefault();
                        handleUndo();
                        break;
                    case "y":
                        e.preventDefault();
                        handleRedo();
                        break;
                    case "f":
                        e.preventDefault();
                        setShowSearch(true);
                        break;
                    case "e":
                        e.preventDefault();
                        handleExport();
                        break;
                    case "d":
                        e.preventDefault();
                        handleDuplicateNode();
                        break;
                }
                return;
            }

            // Single key shortcuts
            switch (e.key.toLowerCase()) {
                case "t":
                    handleAddNode("topic");
                    break;
                case "i":
                    handleAddNode("idea");
                    break;
                case "n":
                    handleAddNode("note");
                    break;
                case "c":
                    if (selectedNodeId) {
                        setShowColorPicker(prev => !prev);
                    }
                    break;
                case "delete":
                case "backspace":
                    handleDeleteSelected();
                    break;
                case "enter":
                    if (selectedNodeId) {
                        setEditingNodeId(selectedNodeId);
                    }
                    break;
                case "escape":
                    setSelectedNodeId(null);
                    setEditingNodeId(null);
                    setShowColorPicker(false);
                    setShowSearch(false);
                    setContextMenu(null);
                    break;
                case "?":
                    setShowShortcuts(true);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        handleAddNode, handleDeleteSelected, handleUndo, handleRedo,
        handleExport, handleDuplicateNode, selectedNodeId
    ]);

    // ==========================================================================
    // NODE SELECTION
    // ==========================================================================
    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedNodeId(node.id);
        setContextMenu(null);
    }, []);

    const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: Node) => {
        if (!isReadOnly) {
            setEditingNodeId(node.id);
        }
    }, [isReadOnly]);

    const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
        e.preventDefault();
        setSelectedNodeId(node.id);
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id });
    }, []);

    // ==========================================================================
    // ADD CHILD NODE (Directional)
    // ==========================================================================
    const handleAddChildNode = useCallback((parentId: string, direction: "top" | "right" | "bottom" | "left") => {
        if (isReadOnly) return;

        saveToHistory();

        const parentNode = nodes.find(n => n.id === parentId);
        if (!parentNode) return;

        // Determine layout from parent
        const layout = (parentNode.data as any).layoutDirection || "LR";

        // Determine new position based on direction
        let x = parentNode.position.x;
        let y = parentNode.position.y;

        const OFFSET_X = 250;
        const OFFSET_Y = 150;

        switch (direction) {
            case "top":
                y -= OFFSET_Y;
                break;
            case "bottom":
                y += OFFSET_Y;
                break;
            case "left":
                x -= OFFSET_X;
                break;
            case "right":
                x += OFFSET_X;
                break;
        }

        // Determine type based on parent logic (Topic -> Idea -> Note, or just Idea -> Idea)
        // For simplicity: Topic -> Idea, Idea -> Idea, Note -> Note (or Idea)
        let newType: NodeType = "idea";
        if (parentNode.type === "topic") newType = "idea";
        else if (parentNode.type === "idea") newType = "idea"; // or note?
        else if (parentNode.type === "note") newType = "note";

        const newNodeId = `${newType}-${Date.now()}`;

        const newNode: Node = {
            id: newNodeId,
            type: newType,
            position: { x, y },
            data: {
                label: `New ${newType.charAt(0).toUpperCase() + newType.slice(1)}`,
                color: DEFAULT_NODE_COLORS[newType],
                layoutDirection: layout, // Inherit layout
            },
            // Set initial handles based on layout to match visual expectation immediately
            // (Though layout engine will fix this on next "Layout" click, we want it correct now)
            sourcePosition: layout === "TB" ? Position.Bottom : (layout === "LR" ? Position.Right : Position.Bottom),
            targetPosition: layout === "TB" ? Position.Top : (layout === "LR" ? Position.Left : Position.Top),
        };

        // Determine source and target handles based on layout rules, NOT just direction
        // The quick-add button direction is what the USER clicked.
        // But the Edge MUST follow the strict rules.

        let sourceHandle: string = "bottom";
        let targetHandle: string = "top";

        // If Layout is enforced, use strict ports
        if (layout === "TB") {
            sourceHandle = "bottom";
            targetHandle = "top";
        } else if (layout === "LR") {
            sourceHandle = "right";
            targetHandle = "left";
        } else {
            // Radial / Freeform: Allow direction to dictate handles
            switch (direction) {
                case "top":
                    sourceHandle = "top";
                    targetHandle = "bottom";
                    break;
                case "bottom":
                    sourceHandle = "bottom";
                    targetHandle = "top";
                    break;
                case "left":
                    sourceHandle = "left";
                    targetHandle = "right";
                    break;
                case "right":
                    sourceHandle = "right";
                    targetHandle = "left";
                    break;
            }
        }

        const newEdge: Edge = {
            id: `edge-${parentId}-${newNodeId}`,
            source: parentId,
            sourceHandle,
            target: newNodeId,
            targetHandle,
            type: "default",
            style: { stroke: "#64748b", strokeWidth: 2 },
            animated: false,
        };

        const newNodes = [...nodes, newNode];
        const newEdges = [...edges, newEdge];

        setNodes(newNodes);
        setEdges(newEdges);
        setSelectedNodeId(newNodeId);
        notifyChange(newNodes, newEdges);

        setTimeout(() => setEditingNodeId(newNodeId), 100);

    }, [isReadOnly, nodes, edges, setNodes, setEdges, notifyChange, saveToHistory]);


    // ==========================================================================
    // INTERACTION EVENT HANDLERS
    // ==========================================================================

    const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
        if (!isReadOnly) {
            interactionActions.startDraggingNode(node.id);
        }
    }, [isReadOnly, interactionActions]);

    const handleNodeDragStop = useCallback(() => {
        interactionActions.endDraggingNode();
        saveToHistory(); // Save state after drag
        notifyChange(nodes, edges);
    }, [nodes, edges, saveToHistory, notifyChange, interactionActions]);

    const handlePaneClick = useCallback((event: React.MouseEvent) => {
        setSelectedNodeId(null);
        setContextMenu(null);
        setShowColorPicker(false);
        setEditingNodeId(null);

        // Reset all interaction state including hovered node (hides plus buttons)
        interactionActions.reset();
    }, [interactionActions]);

    // ... handleAddChildNode logic ...

    // ==========================================================================
    // ENHANCED NODES WITH EDITING AND INTERACTIONS
    // ==========================================================================
    const enhancedNodes = useMemo(() => {
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                // Existing props
                isEditing: editingNodeId === node.id,
                isSelected: selectedNodeId === node.id,
                isSearchMatch: searchMatches.includes(node.id),
                onLabelChange: (newLabel: string) => handleUpdateNodeLabel(node.id, newLabel),
                onAddNode: (direction: "top" | "right" | "bottom" | "left") => handleAddChildNode(node.id, direction),

                // Interaction Props - CRITICAL: Check if THIS node is the hovered one
                interactionMode: interactionState.mode,
                isNodeHovered: interactionState.hoveredNodeId === node.id,
                isPlusHovered: interactionState.mode === 'PLUS_HOVER' && interactionState.hoveredNodeId === node.id,
            },
            selected: selectedNodeId === node.id,
        }));
    }, [
        nodes,
        editingNodeId,
        selectedNodeId,
        searchMatches,
        handleUpdateNodeLabel,
        handleAddChildNode,
        interactionState
    ]);

    // ... rest of component ...

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <div className="flex flex-col h-full bg-slate-50 relative" ref={reactFlowWrapper}>
            {/* Toolbar */}
            {!isReadOnly && (
                <EditorToolbar
                    onAddNode={handleAddNode}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onExport={handleExport}
                    onToggleColorPicker={() => selectedNodeId && setShowColorPicker(prev => !prev)}
                    onSearch={() => setShowSearch(prev => !prev)}
                    onShowShortcuts={() => setShowShortcuts(true)}
                    canUndo={historyIndexRef.current > 0}
                    canRedo={historyIndexRef.current < historyRef.current.length - 1}
                    isReadOnly={isReadOnly}
                    showColorPicker={showColorPicker}
                    selectedNodeColor={
                        selectedNode
                            ? (selectedNode.data as { color?: string }).color ||
                            DEFAULT_NODE_COLORS[selectedNode.type as NodeType] ||
                            '#3b82f6'
                            : undefined
                    }
                />
            )}

            {/* Search Bar */}
            <SearchBar
                open={showSearch}
                onSearch={handleSearch}
                onNavigate={handleSearchNavigate}
                matchCount={searchMatches.length}
                currentMatch={currentMatchIndex}
                onClose={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                    setSearchMatches([]);
                }}
            />

            {/* AI Components */}

            {selectedNode && !isReadOnly && (
                <NodeToolbar
                    nodeId={selectedNode.id}
                    isVisible={!!selectedNode}
                    position={Position.Top}
                    offset={20}
                    className="z-50"
                >
                    <AISuggestButton
                        onClick={() => setShowAIPrompt(prev => !prev)}
                        isActive={showAIPrompt || showAISidebar}
                    />
                </NodeToolbar>
            )}

            <AIPromptInput
                isOpen={showAIPrompt}
                onClose={() => setShowAIPrompt(false)}
                onSubmit={handleAIPromptSubmit}
                isGenerating={isGeneratingAI}
            />

            <AISuggestSidebar
                isOpen={showAISidebar}
                onClose={() => setShowAISidebar(false)}
                suggestions={aiSuggestions}
                isGenerating={isGeneratingAI}
                onAddSuggestion={handleAddSuggestion}
            />

            {/* Color Picker */}
            {showColorPicker && selectedNode && (
                <div className="absolute top-20 left-20 z-50">
                    <ColorPicker
                        selectedColor={(selectedNode.data as { color?: string }).color || "#3b82f6"}
                        onColorChange={(color) => {
                            handleUpdateNodeColor(color);
                            setShowColorPicker(false);
                        }}
                        onClose={() => setShowColorPicker(false)}
                    />
                </div>
            )}

            {/* Canvas */}
            <div className="flex-1 w-full h-full">
                <ReactFlow
                    nodes={enhancedNodes}
                    edges={edges}
                    nodeTypes={NODE_TYPES}
                    edgeTypes={EDGE_TYPES}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={handleEdgesChange}
                    onConnect={onConnect}
                    onReconnect={onReconnect}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onNodeContextMenu={onNodeContextMenu}
                    onNodeDragStart={handleNodeDragStart}
                    onNodeDragStop={handleNodeDragStop}
                    onPaneClick={handlePaneClick}
                    onMoveStart={() => interactionActions.startPanning()}
                    onMoveEnd={() => interactionActions.endPanning()}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    panOnDrag={!isReadOnly}
                    nodesDraggable={!isReadOnly}
                    nodesConnectable={!isReadOnly}
                    elementsSelectable={!isReadOnly}
                    edgesReconnectable={!isReadOnly}
                    defaultEdgeOptions={{
                        type: "default",
                        animated: false,
                        style: { stroke: "#64748b", strokeWidth: 2 },
                    }}
                    connectionLineStyle={{ stroke: "#64748b", strokeWidth: 2 }}
                    snapToGrid
                    snapGrid={[15, 15]}
                >
                    <Controls showInteractive={false} />
                    <MiniMap
                        nodeColor={(node) => (node.data as { color?: string }).color || "#94a3b8"}
                        maskColor="rgba(0,0,0,0.1)"
                    />
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                </ReactFlow>
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onEdit={() => {
                        setEditingNodeId(contextMenu.nodeId);
                        setContextMenu(null);
                    }}
                    onDelete={() => {
                        handleDeleteSelected();
                        setContextMenu(null);
                    }}
                    onDuplicate={() => {
                        setSelectedNodeId(contextMenu.nodeId);
                        // Delay to allow state update, then duplicate
                        setTimeout(() => handleDuplicateNode(), 0);
                        setContextMenu(null);
                    }}
                    onChangeColor={() => {
                        setShowColorPicker(true);
                        setContextMenu(null);
                    }}
                    onClose={() => setContextMenu(null)}
                />
            )}

            {/* Shortcuts Dialog */}
            <ShortcutsDialog
                open={showShortcuts}
                onOpenChange={(open) => setShowShortcuts(open)}
            />
        </div>
    );
}


// Wrapper COMPONENT with Providers
export function MindMapCanvas(props: MindMapCanvasProps) {
    return (
        <ReactFlowProvider>
            <InteractionProvider isReadOnly={props.isReadOnly}>
                <MindMapCanvasInner {...props} />
            </InteractionProvider>
        </ReactFlowProvider>
    );
}
