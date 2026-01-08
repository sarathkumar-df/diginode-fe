"use client";

/**
 * Mind Map Editor Page
 * 
 * Main editor shell with:
 * - Lock management
 * - Auto-save with debouncing
 * - Version polling in read-only mode
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Sparkles } from "lucide-react";
import { Toaster, toast } from "sonner";

import { useMapLock } from "@/hooks/useMapLock";
import { MindMapCanvas } from "@/components/editor/MindMapCanvas";
import { LockStatusBadge } from "@/components/editor/LockStatusBadge";
import { LockLostModal } from "@/components/editor/LockLostModal";
import { NewChangesBanner } from "@/components/editor/NewChangesBanner";

import { getMap, saveMap, getMapVersion } from "@/lib/actions/map";
import { generateIdeas } from "@/lib/actions/ai";
import type { MindMapContent } from "@/lib/types/mindmap";
import { createEmptyMindMapContent } from "@/lib/types/mindmap";

import { LayoutSelector } from "@/components/editor/LayoutSelector";
import { getLayoutedElements, type LayoutDirection } from "@/lib/layout";

// =============================================================================
// CONSTANTS
// =============================================================================

const VERSION_POLL_INTERVAL_MS = 10 * 1000; // 10 seconds
const AUTO_SAVE_DEBOUNCE_MS = 2 * 1000; // 2 seconds

// =============================================================================
// COMPONENT
// =============================================================================

export default function EditorPage() {
    const params = useParams();
    const mapId = params.id as string;
    const router = useRouter();

    // State
    const [content, setContent] = useState<MindMapContent>(createEmptyMindMapContent());
    const [title, setTitle] = useState<string>("Untitled Map");
    const [version, setVersion] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasNewVersion, setHasNewVersion] = useState(false);
    const [showLockLostModal, setShowLockLostModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const pendingContentRef = useRef<MindMapContent | null>(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Lock management
    const lock = useMapLock(mapId, {
        onLockLost: () => {
            setShowLockLostModal(true);
            // Clear any pending saves
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        },
        onLockAcquired: (wasStolen) => {
            if (wasStolen) {
                toast.info("Lock acquired", {
                    description: "The previous user's session expired. You now have editing access.",
                });
            }
        },
        onReadOnly: (lockedByUserName) => {
            toast.info("Read-only mode", {
                description: `${lockedByUserName || "Another user"} is currently editing this map.`,
            });
        },
    });

    // ==========================================================================
    // LOAD MAP DATA
    // ==========================================================================
    useEffect(() => {
        async function loadMap() {
            try {
                setIsLoading(true);
                setError(null);

                const result = await getMap({ mapId });

                if (!result.success) {
                    setError(result.error.message);
                    return;
                }

                setContent(result.data.content);
                setTitle(result.data.title);
                setVersion(result.data.version);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load map");
            } finally {
                setIsLoading(false);
            }
        }

        loadMap();
    }, [mapId]);

    // ==========================================================================
    // VERSION POLLING (Read-only mode)
    // ==========================================================================
    useEffect(() => {
        if (lock.canEdit) {
            setHasNewVersion(false);
            return;
        }

        const pollVersion = async () => {
            try {
                const result = await getMapVersion(mapId);
                if (result.success && result.data.version > version) {
                    setHasNewVersion(true);
                }
            } catch (err) {
                console.error("[Editor] Version poll failed:", err);
            }
        };

        const interval = setInterval(pollVersion, VERSION_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [mapId, version, lock.canEdit]);

    // ==========================================================================
    // HANDLE CONTENT CHANGES
    // ==========================================================================
    const handleContentChange = useCallback(
        (newContent: MindMapContent) => {
            if (!lock.canEdit) return;

            setContent(newContent);
            pendingContentRef.current = newContent;

            // Debounce auto-save
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            autoSaveTimeoutRef.current = setTimeout(async () => {
                if (!pendingContentRef.current) return;

                try {
                    setIsSaving(true);
                    const result = await saveMap({
                        mapId,
                        content: pendingContentRef.current,
                        currentVersion: version,
                    });

                    if (result.success) {
                        setVersion(result.data.newVersion);
                        pendingContentRef.current = null;
                    } else if (result.error.code === "VERSION_CONFLICT") {
                        toast.error("Version conflict", {
                            description: "The map was modified. Refreshing...",
                        });
                        router.refresh();
                    } else if (result.error.code === "LOCK_NOT_HELD") {
                        setShowLockLostModal(true);
                    } else {
                        toast.error("Save failed", {
                            description: result.error.message,
                        });
                    }
                } catch (err) {
                    toast.error("Save failed", {
                        description: err instanceof Error ? err.message : "Unknown error",
                    });
                } finally {
                    setIsSaving(false);
                }
            }, AUTO_SAVE_DEBOUNCE_MS);
        },
        [lock.canEdit, mapId, version, router]
    );

    // ==========================================================================
    // MANUAL SAVE
    // ==========================================================================
    const handleManualSave = useCallback(async () => {
        if (!lock.canEdit) return;

        try {
            setIsSaving(true);
            const result = await saveMap({
                mapId,
                content,
                currentVersion: version,
            });

            if (result.success) {
                setVersion(result.data.newVersion);
                toast.success("Saved successfully");
            } else {
                toast.error("Save failed", {
                    description: result.error.message,
                });
            }
        } catch (err) {
            toast.error("Save failed", {
                description: err instanceof Error ? err.message : "Unknown error",
            });
        } finally {
            setIsSaving(false);
        }
    }, [lock.canEdit, mapId, content, version]);

    // ==========================================================================
    // AI GENERATE IDEAS
    // ==========================================================================
    const handleGenerateIdeas = useCallback(async () => {
        if (!lock.canEdit) return;

        // Generate ideas based on the first node's label
        const firstNode = content.nodes[0];
        if (!firstNode) {
            toast.error("No nodes to generate ideas from");
            return;
        }

        try {
            toast.loading("Generating ideas...");

            const result = await generateIdeas({
                nodeText: firstNode.data.label,
            });

            toast.dismiss();

            if (result.success) {
                // Add generated ideas as new nodes
                const newNodes = [...content.nodes];
                const newEdges = [...content.edges];

                const baseX = firstNode.position?.x || 400;
                const baseY = firstNode.position?.y || 300;

                result.data.ideas.forEach((idea, index) => {
                    const nodeId = `idea-ai-${Date.now()}-${index}`;
                    const angle = (index * (360 / result.data.ideas.length)) * (Math.PI / 180);
                    const radius = 200;

                    // Position in a circle around the parent
                    const x = baseX + Math.cos(angle) * radius;
                    const y = baseY + Math.sin(angle) * radius + 100;

                    const nodeType = idea.type === "topic" ? "topic" : idea.type === "note" ? "note" : "idea";

                    newNodes.push({
                        id: nodeId,
                        type: nodeType,
                        position: { x, y },
                        data: {
                            label: idea.label,
                            description: idea.description,
                            color: nodeType === "topic" ? "#3b82f6" : nodeType === "idea" ? "#eab308" : "#22c55e",
                        },
                    });

                    // Connect to parent node
                    newEdges.push({
                        id: `edge-${firstNode.id}-${nodeId}`,
                        source: firstNode.id,
                        target: nodeId,
                        type: "default",
                        animated: false,
                        style: { stroke: "#64748b", strokeWidth: 2 },
                    });
                });

                // Update content
                const newContent = {
                    ...content,
                    nodes: newNodes,
                    edges: newEdges,
                };

                setContent(newContent);
                handleContentChange(newContent);

                toast.success("Ideas generated!", {
                    description: `Added ${result.data.ideas.length} ideas. ${result.data.remainingRequests} requests remaining this hour.`,
                });
            } else {
                toast.error("Generation failed", {
                    description: result.error.message,
                });
            }
        } catch (err) {
            toast.dismiss();
            toast.error("Generation failed", {
                description: err instanceof Error ? err.message : "Unknown error",
            });
        }
    }, [lock.canEdit, content, handleContentChange]);

    // ==========================================================================
    // REFRESH HANDLER
    // ==========================================================================
    const handleRefresh = useCallback(() => {
        window.location.reload();
    }, []);

    // ==========================================================================
    // LAYOUT HANDLER
    // ==========================================================================
    const handleLayoutChange = useCallback((direction: LayoutDirection) => {
        if (!lock.canEdit) return;

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            content.nodes,
            content.edges,
            direction
        );

        const newContent = {
            ...content,
            nodes: layoutedNodes as typeof content.nodes,
            edges: layoutedEdges as typeof content.edges,
        };

        setContent(newContent);
        handleContentChange(newContent);
        toast.success(`Layout changed to ${direction === "LR" ? "Horizontal" : direction === "TB" ? "Vertical" : "Star View"}`);
    }, [lock.canEdit, content, handleContentChange]);

    // ==========================================================================
    // CLEANUP
    // ==========================================================================
    useEffect(() => {
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, []);

    // ==========================================================================
    // RENDER
    // ==========================================================================

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading map...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive">{error}</p>
                    <Button className="mt-4" onClick={() => router.push("/dashboard")}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col">
            {/* Header */}
            <header className="flex items-center justify-between border-b px-4 py-2">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                    >
                        <Link href="/dashboard">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Dashboard
                        </Link>
                    </Button>
                    <h1 className="text-lg font-semibold">{title}</h1>
                    <LockStatusBadge
                        status={lock.status}
                        lockedByUserName={lock.lockedByUserName}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {lock.canEdit && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateIdeas}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                AI Ideas
                            </Button>

                            <LayoutSelector onLayoutChange={handleLayoutChange} />

                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleManualSave}
                                disabled={isSaving}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* New changes banner */}
            {hasNewVersion && <NewChangesBanner onRefresh={handleRefresh} />}

            {/* Canvas */}
            <main className="flex-1">
                <MindMapCanvas
                    content={content}
                    onContentChange={handleContentChange}
                    isReadOnly={!lock.canEdit}
                />
            </main>

            {/* Lock lost modal */}
            <LockLostModal
                open={showLockLostModal}
                onRefresh={handleRefresh}
                onViewReadOnly={() => setShowLockLostModal(false)}
            />

            <Toaster richColors position="bottom-right" />
        </div>
    );
}
