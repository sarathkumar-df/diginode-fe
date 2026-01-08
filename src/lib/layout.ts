import dagre from "dagre";
import { Node, Edge, Position } from "@xyflow/react";

export type LayoutDirection = "TB" | "LR" | "RADIAL";

const NODE_WIDTH = 250;
const NODE_HEIGHT = 80;

/**
 * Apply layout to nodes and edges
 */
export const getLayoutedElements = (
    nodes: Node[],
    edges: Edge[],
    direction: LayoutDirection = "LR"
) => {
    if (direction === "RADIAL") {
        return getRadialLayout(nodes, edges);
    }

    const isHorizontal = direction === "LR";
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    // Increase separation to avoid overlaps
    dagreGraph.setGraph({
        rankdir: direction,
        ranksep: 200, // Distance between ranks (columns in LR, rows in TB)
        nodesep: 100  // Distance between nodes in same rank
    });

    nodes.forEach((node) => {
        // Use larger dimensions for layout calculation to ensure buffer
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        // Dagre uses center point, React Flow uses top-left
        const x = nodeWithPosition.x - NODE_WIDTH / 2;
        const y = nodeWithPosition.y - NODE_HEIGHT / 2;

        return {
            ...node,
            targetPosition: isHorizontal ? Position.Left : Position.Top,
            sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
            position: { x, y },
            data: {
                ...node.data,
                layoutDirection: direction
            }
        };
    });

    const layoutedEdges = edges.map((edge) => ({
        ...edge,
        sourceHandle: isHorizontal ? "right" : "bottom",
        targetHandle: isHorizontal ? "left" : "top",
    }));

    return { nodes: layoutedNodes, edges: layoutedEdges };
};

/**
 * Custom Radial Layout Algorithm (Star View)
 */
const getRadialLayout = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return { nodes, edges };

    // 1. Build adjacency list and find root (node with no incoming edges or first node)
    const adjacency = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    nodes.forEach(n => {
        adjacency.set(n.id, []);
        inDegree.set(n.id, 0);
    });

    edges.forEach(e => {
        adjacency.get(e.source)?.push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // Assume the node with 0 in-degree is root, or the first node if cycle/isolated
    let rootId = nodes[0].id;
    for (const [id, count] of inDegree.entries()) {
        if (count === 0) {
            rootId = id;
            break;
        }
    }

    // 2. BFS to assign levels
    const levels = new Map<string, number>();
    const queue = [rootId];
    levels.set(rootId, 0);
    const visited = new Set<string>([rootId]);

    // Keep track of nodes at each level for spacing
    const nodesAtLevel = new Map<number, string[]>();
    nodesAtLevel.set(0, [rootId]);

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        const currentLevel = levels.get(currentId)!;
        const children = adjacency.get(currentId) || [];

        children.forEach(childId => {
            if (!visited.has(childId)) {
                visited.add(childId);
                const nextLevel = currentLevel + 1;
                levels.set(childId, nextLevel);
                queue.push(childId);

                if (!nodesAtLevel.has(nextLevel)) {
                    nodesAtLevel.set(nextLevel, []);
                }
                nodesAtLevel.get(nextLevel)?.push(childId);
            }
        });
    }

    // 3. Assign positions
    // Root at (0,0) or center of previous bounds (not handled here specifically, just relative 0,0)
    // We will center everything afterwards or just assume 0,0 is center.
    // Ideally we want to preserve the root's current position if possible, but for a full layout 
    // it's often easier to layout from 0,0 and let the user move the group.

    // However, to prevent jumping far away, we can use the root's current position as center.
    const rootNode = nodes.find(n => n.id === rootId)!;
    const centerX = rootNode.position.x;
    const centerY = rootNode.position.y;

    const newPositions = new Map<string, { x: number, y: number }>();
    newPositions.set(rootId, { x: centerX, y: centerY });

    nodesAtLevel.forEach((levelNodes, level) => {
        if (level === 0) return;

        const radius = level * 300; // Increase radius per level
        const angleStep = (2 * Math.PI) / levelNodes.length;

        levelNodes.forEach((nodeId, index) => {
            const angle = index * angleStep;
            newPositions.set(nodeId, {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        });
    });

    const layoutedNodes = nodes.map(node => {
        const pos = newPositions.get(node.id) || node.position;
        return {
            ...node,
            // Reset handles for radial/organic feel
            // For radial, we might want dynamic ports or just Center/Center if using floating edges
            // But with fixed 4 handles, we need to pick the best one.
            // For now, let's stick to a default, or compute based on angle from parent.
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom,
            position: pos,
            data: {
                ...node.data,
                layoutDirection: "RADIAL"
            }
        };
    });

    // For Radial, we need to update edges to point to correct handles based on relative position
    // This is a bit complex as we need parent position.
    const layoutedEdges = edges.map(edge => {
        const sourceNode = layoutedNodes.find(n => n.id === edge.source);
        const targetNode = layoutedNodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) return edge;

        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;

        // Choose source handle based on dominant direction
        let sourceHandle = "bottom";
        if (Math.abs(dx) > Math.abs(dy)) {
            sourceHandle = dx > 0 ? "right" : "left";
        } else {
            sourceHandle = dy > 0 ? "bottom" : "top";
        }

        // Choose target handle (opposite of source roughly)
        // Or blindly face the parent
        let targetHandle = "top";
        if (Math.abs(dx) > Math.abs(dy)) {
            targetHandle = dx > 0 ? "left" : "right";
        } else {
            targetHandle = dy > 0 ? "top" : "bottom";
        }

        return {
            ...edge,
            sourceHandle,
            targetHandle
        };
    });

    return { nodes: layoutedNodes, edges: layoutedEdges };
};
