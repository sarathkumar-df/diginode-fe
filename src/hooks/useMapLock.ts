"use client";

/**
 * useMapLock Hook
 * 
 * Client-side hook for managing pessimistic locking on mind maps.
 * 
 * Features:
 * - Automatic lock acquisition on mount
 * - Heartbeat every 30 seconds
 * - LOCK_LOST detection with callback
 * - Cleanup on unmount and page unload
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { acquireLock, refreshLock, releaseLock, type LockStatus } from "@/lib/actions/lock";

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Heartbeat interval in milliseconds (30 seconds)
 * Half of the lock timeout to ensure robust keepalive
 */
const HEARTBEAT_INTERVAL_MS = 30 * 1000;

// =============================================================================
// TYPES
// =============================================================================

export type MapLockState = {
    /** Current status of the lock */
    status: "loading" | "acquired" | "read-only" | "lock-lost" | "error";
    /** Whether the current user holds the editing lock */
    canEdit: boolean;
    /** Whether the lock was stolen from another user */
    wasStolen: boolean;
    /** ID of the user holding the lock (if not current user) */
    lockedByUserId?: string;
    /** Name of the user holding the lock (if not current user) */
    lockedByUserName?: string;
    /** Error message if status is "error" */
    error?: string;
};

export type UseMapLockOptions = {
    /** Callback when lock is lost (stolen by another user) */
    onLockLost?: () => void;
    /** Callback when lock is successfully acquired */
    onLockAcquired?: (wasStolen: boolean) => void;
    /** Callback when entering read-only mode */
    onReadOnly?: (lockedByUserName?: string) => void;
    /** Whether to automatically acquire lock on mount */
    autoAcquire?: boolean;
};

export type UseMapLockReturn = MapLockState & {
    /** Manually acquire the lock */
    acquire: () => Promise<void>;
    /** Manually release the lock */
    release: () => Promise<void>;
    /** Force refresh the lock (reset heartbeat) */
    refresh: () => Promise<void>;
};

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

export function useMapLock(
    mapId: string,
    options: UseMapLockOptions = {}
): UseMapLockReturn {
    const {
        onLockLost,
        onLockAcquired,
        onReadOnly,
        autoAcquire = true,
    } = options;

    // State
    const [state, setState] = useState<MapLockState>({
        status: "loading",
        canEdit: false,
        wasStolen: false,
    });

    // Refs for cleanup and callbacks
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isUnmountingRef = useRef(false);
    const hasAcquiredRef = useRef(false);

    // Store callbacks in refs to avoid dependency issues
    const onLockLostRef = useRef(onLockLost);
    const onLockAcquiredRef = useRef(onLockAcquired);
    const onReadOnlyRef = useRef(onReadOnly);

    // Update refs when callbacks change
    useEffect(() => {
        onLockLostRef.current = onLockLost;
        onLockAcquiredRef.current = onLockAcquired;
        onReadOnlyRef.current = onReadOnly;
    }, [onLockLost, onLockAcquired, onReadOnly]);

    // ==========================================================================
    // ACQUIRE LOCK
    // ==========================================================================
    const acquire = useCallback(async () => {
        if (hasAcquiredRef.current) return; // Prevent double acquire
        hasAcquiredRef.current = true;

        try {
            setState((prev) => ({ ...prev, status: "loading" }));

            const result = await acquireLock({ mapId });

            if (!result.success) {
                setState({
                    status: "error",
                    canEdit: false,
                    wasStolen: false,
                    error: result.error.message,
                });
                return;
            }

            const { status, lockedByUserId, lockedByUserName, wasStolen } = result.data;

            if (status === "ACQUIRED") {
                setState({
                    status: "acquired",
                    canEdit: true,
                    wasStolen: wasStolen || false,
                });
                onLockAcquiredRef.current?.(wasStolen || false);
            } else if (status === "READ_ONLY") {
                setState({
                    status: "read-only",
                    canEdit: false,
                    wasStolen: false,
                    lockedByUserId,
                    lockedByUserName,
                });
                onReadOnlyRef.current?.(lockedByUserName);
            }
        } catch (error) {
            setState({
                status: "error",
                canEdit: false,
                wasStolen: false,
                error: error instanceof Error ? error.message : "Failed to acquire lock",
            });
        }
    }, [mapId]);

    // ==========================================================================
    // REFRESH LOCK (HEARTBEAT)
    // ==========================================================================
    const refresh = useCallback(async () => {
        if (state.status !== "acquired") return;

        try {
            const result = await refreshLock({ mapId });

            if (!result.success) {
                console.error("[useMapLock] Heartbeat failed:", result.error);
                return;
            }

            if (result.data.status === "LOCK_LOST") {
                // Lock was stolen! User was disconnected too long
                setState({
                    status: "lock-lost",
                    canEdit: false,
                    wasStolen: false,
                });

                // Stop heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }

                onLockLostRef.current?.();
            }
        } catch (error) {
            console.error("[useMapLock] Heartbeat error:", error);
        }
    }, [mapId, state.status]);

    // ==========================================================================
    // RELEASE LOCK
    // ==========================================================================
    const release = useCallback(async () => {
        if (state.status !== "acquired") return;

        try {
            await releaseLock({ mapId });

            if (!isUnmountingRef.current) {
                setState({
                    status: "read-only",
                    canEdit: false,
                    wasStolen: false,
                });
            }
        } catch (error) {
            console.error("[useMapLock] Release error:", error);
        }
    }, [mapId, state.status]);

    // ==========================================================================
    // SETUP HEARTBEAT
    // ==========================================================================
    useEffect(() => {
        if (state.status === "acquired") {
            // Start heartbeat interval
            heartbeatIntervalRef.current = setInterval(refresh, HEARTBEAT_INTERVAL_MS);

            return () => {
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }
            };
        }
    }, [state.status, refresh]);

    // ==========================================================================
    // AUTO ACQUIRE ON MOUNT
    // ==========================================================================
    useEffect(() => {
        if (autoAcquire && mapId) {
            acquire();
        }

        return () => {
            hasAcquiredRef.current = false;
        };
    }, [mapId]); // Only depend on mapId, not acquire

    // ==========================================================================
    // CLEANUP ON UNMOUNT
    // ==========================================================================
    useEffect(() => {
        return () => {
            isUnmountingRef.current = true;

            // Clear heartbeat
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
        };
    }, []);

    // ==========================================================================
    // HANDLE PAGE UNLOAD
    // ==========================================================================
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (state.canEdit) {
                // Use sendBeacon for reliable cleanup during page unload
                const payload = JSON.stringify({ mapId });
                navigator.sendBeacon?.("/api/release-lock", payload);
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            // Also try to release on unmount
            if (state.canEdit) {
                const payload = JSON.stringify({ mapId });
                navigator.sendBeacon?.("/api/release-lock", payload);
            }
        };
    }, [mapId, state.canEdit]);

    return {
        ...state,
        acquire,
        release,
        refresh,
    };
}
