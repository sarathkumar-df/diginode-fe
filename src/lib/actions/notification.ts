"use server";

/**
 * Notification Actions
 * 
 * Server actions for managing user notifications.
 */

import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import {
    ActionResult,
    successResult,
    handleActionError,
} from "@/lib/errors";

// =============================================================================
// TYPES
// =============================================================================

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    referenceId: string | null;
    referenceType: string | null;
    isRead: boolean;
    createdAt: Date;
}

// =============================================================================
// LIST NOTIFICATIONS
// =============================================================================

export async function listNotifications(): Promise<ActionResult<Notification[]>> {
    try {
        const userId = await getCurrentUserId();

        const notifications = await db.notification.findMany({
            where: {
                userId: userId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20, // Only fetch recent notifications
        });

        return successResult(notifications);
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET UNREAD COUNT
// =============================================================================

export async function getUnreadNotificationCount(): Promise<ActionResult<number>> {
    try {
        const userId = await getCurrentUserId();

        const count = await db.notification.count({
            where: {
                userId: userId,
                isRead: false,
            },
        });

        return successResult(count);
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// MARK AS READ
// =============================================================================

export async function markNotificationAsRead(
    notificationId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();

        await db.notification.updateMany({
            where: {
                id: notificationId,
                userId: userId, // Ensure user owns this notification
            },
            data: {
                isRead: true,
            },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// MARK ALL AS READ
// =============================================================================

export async function markAllNotificationsAsRead(): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();

        await db.notification.updateMany({
            where: {
                userId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// CREATE NOTIFICATION (Internal helper)
// =============================================================================

export async function createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    referenceId?: string;
    referenceType?: string;
}): Promise<void> {
    await db.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            referenceId: data.referenceId || null,
            referenceType: data.referenceType || null,
        },
    });
}
