"use server";

/**
 * Share Actions
 * 
 * Server actions for sharing mind maps with users, teams, and generating public links.
 */

import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentOrganizationId } from "@/lib/auth";
import {
    ActionResult,
    successResult,
    handleActionError,
    NotFoundError,
    ForbiddenError,
} from "@/lib/errors";
import { createNotification } from "@/lib/actions/notification";
import { randomBytes } from "crypto";

// =============================================================================
// TYPES
// =============================================================================

export interface ShareInfo {
    id: string;
    type: "user" | "team";
    name: string;
    email?: string;
    permission: string;
    sharedAt: Date;
}

export interface MapShareDetails {
    shares: ShareInfo[];
    publicLinkToken: string | null;
    publicLinkUrl: string | null;
}

// =============================================================================
// SHARE WITH USER
// =============================================================================

export async function shareWithUser(
    mapId: string,
    targetUserEmail: string,
    permission: "view" | "edit" = "view"
): Promise<ActionResult<ShareInfo>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        // Verify map exists and user has access
        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId: orgId,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map not found");
        }

        if (map.ownerId !== userId) {
            throw new ForbiddenError("Only the owner can share this map");
        }

        // Find target user
        const targetUser = await db.user.findFirst({
            where: {
                email: targetUserEmail,
                organizationId: orgId,
            },
        });

        if (!targetUser) {
            throw new NotFoundError("User not found in your organization");
        }

        // Can't share with yourself
        if (targetUser.id === userId) {
            throw new ForbiddenError("You cannot share with yourself");
        }

        // Create or update share
        const share = await db.mapShare.upsert({
            where: {
                mapId_userId: {
                    mapId: mapId,
                    userId: targetUser.id,
                },
            },
            update: {
                permission: permission,
            },
            create: {
                mapId: mapId,
                userId: targetUser.id,
                permission: permission,
                sharedById: userId,
            },
        });

        // Get sharer's name for notification
        const sharer = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });
        const sharerName = sharer?.name || sharer?.email || "Someone";

        // Create notification for target user
        await createNotification({
            userId: targetUser.id,
            type: "map_shared",
            title: `"${map.title}" shared with you`,
            message: `${sharerName} shared the mind map "${map.title}" with you (${permission} access)`,
            referenceId: mapId,
            referenceType: "map",
        });

        return successResult({
            id: share.id,
            type: "user",
            name: targetUser.name || targetUser.email,
            email: targetUser.email,
            permission: share.permission,
            sharedAt: share.sharedAt,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// SHARE WITH TEAM
// =============================================================================

export async function shareWithTeam(
    mapId: string,
    teamId: string,
    permission: "view" | "edit" = "view"
): Promise<ActionResult<ShareInfo>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        // Verify map exists and user has access
        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId: orgId,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map not found");
        }

        if (map.ownerId !== userId) {
            throw new ForbiddenError("Only the owner can share this map");
        }

        // Verify team exists and user is a member
        const team = await db.team.findFirst({
            where: {
                id: teamId,
                organizationId: orgId,
            },
            include: {
                members: true,
            },
        });

        if (!team) {
            throw new NotFoundError("Team not found");
        }

        const isMember = team.members.some(m => m.userId === userId);
        if (!isMember) {
            throw new ForbiddenError("You are not a member of this team");
        }

        // Create or update share
        const share = await db.mapShare.upsert({
            where: {
                mapId_teamId: {
                    mapId: mapId,
                    teamId: teamId,
                },
            },
            update: {
                permission: permission,
            },
            create: {
                mapId: mapId,
                teamId: teamId,
                permission: permission,
                sharedById: userId,
            },
        });

        // Get sharer's name for notification
        const sharer = await db.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
        });
        const sharerName = sharer?.name || sharer?.email || "Someone";

        // Notify all team members except the sharer
        const otherMembers = team.members.filter(m => m.userId !== userId);
        for (const member of otherMembers) {
            await createNotification({
                userId: member.userId,
                type: "map_shared",
                title: `"${map.title}" shared with ${team.name}`,
                message: `${sharerName} shared the mind map "${map.title}" with your team "${team.name}" (${permission} access)`,
                referenceId: mapId,
                referenceType: "map",
            });
        }

        return successResult({
            id: share.id,
            type: "team",
            name: team.name,
            permission: share.permission,
            sharedAt: share.sharedAt,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GENERATE PUBLIC LINK
// =============================================================================

export async function generatePublicLink(
    mapId: string
): Promise<ActionResult<{ token: string; url: string }>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        // Verify map exists and user has access
        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId: orgId,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map not found");
        }

        if (map.ownerId !== userId) {
            throw new ForbiddenError("Only the owner can generate a public link");
        }

        // Generate or reuse token
        let token = map.publicLinkToken;
        if (!token) {
            token = randomBytes(32).toString("hex");
            await db.mindMap.update({
                where: { id: mapId },
                data: { publicLinkToken: token },
            });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const url = `${baseUrl}/shared/${token}`;

        return successResult({ token, url });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// REVOKE PUBLIC LINK
// =============================================================================

export async function revokePublicLink(
    mapId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId: orgId,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map not found");
        }

        if (map.ownerId !== userId) {
            throw new ForbiddenError("Only the owner can revoke the public link");
        }

        await db.mindMap.update({
            where: { id: mapId },
            data: { publicLinkToken: null },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET MAP SHARES
// =============================================================================

export async function getMapShares(
    mapId: string
): Promise<ActionResult<MapShareDetails>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        const map = await db.mindMap.findFirst({
            where: {
                id: mapId,
                organizationId: orgId,
            },
            include: {
                shares: true,
            },
        });

        if (!map) {
            throw new NotFoundError("Mind map not found");
        }

        // Get details for each share
        const shares: ShareInfo[] = [];

        for (const share of map.shares) {
            if (share.teamId) {
                const team = await db.team.findUnique({
                    where: { id: share.teamId },
                });
                if (team) {
                    shares.push({
                        id: share.id,
                        type: "team",
                        name: team.name,
                        permission: share.permission,
                        sharedAt: share.sharedAt,
                    });
                }
            } else if (share.userId) {
                const user = await db.user.findUnique({
                    where: { id: share.userId },
                });
                if (user) {
                    shares.push({
                        id: share.id,
                        type: "user",
                        name: user.name || user.email,
                        email: user.email,
                        permission: share.permission,
                        sharedAt: share.sharedAt,
                    });
                }
            }
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const publicLinkUrl = map.publicLinkToken
            ? `${baseUrl}/shared/${map.publicLinkToken}`
            : null;

        return successResult({
            shares,
            publicLinkToken: map.publicLinkToken,
            publicLinkUrl,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// REMOVE SHARE
// =============================================================================

export async function removeShare(
    shareId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        const share = await db.mapShare.findUnique({
            where: { id: shareId },
            include: { map: true },
        });

        if (!share) {
            throw new NotFoundError("Share not found");
        }

        if (share.map.ownerId !== userId) {
            throw new ForbiddenError("Only the owner can remove shares");
        }

        await db.mapShare.delete({
            where: { id: shareId },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET MAPS SHARED WITH ME
// =============================================================================

export interface SharedMapInfo {
    id: string;
    title: string;
    permission: string;
    sharedBy: string;
    sharedAt: Date;
    updatedAt: Date;
}

export async function getSharedWithMeMaps(): Promise<ActionResult<SharedMapInfo[]>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentOrganizationId();

        // Get user's team memberships
        const userTeamMemberships = await db.teamMember.findMany({
            where: { userId },
            select: { teamId: true },
        });
        const userTeamIds = userTeamMemberships.map(m => m.teamId);

        // Find all shares that are either directly to this user or to teams they're in
        const shares = await db.mapShare.findMany({
            where: {
                OR: [
                    { userId: userId },
                    { teamId: { in: userTeamIds } },
                ],
            },
            include: {
                map: {
                    select: {
                        id: true,
                        title: true,
                        updatedAt: true,
                        ownerId: true,
                        organizationId: true,
                    },
                },
            },
            orderBy: {
                sharedAt: "desc",
            },
        });

        // Filter to only maps in the user's organization and not owned by them
        const filteredShares = shares.filter(
            s => s.map.organizationId === orgId && s.map.ownerId !== userId
        );

        // Get sharer info for each share
        const result: SharedMapInfo[] = [];
        const seenMapIds = new Set<string>();

        for (const share of filteredShares) {
            // Avoid duplicates (if shared via both user and team)
            if (seenMapIds.has(share.map.id)) continue;
            seenMapIds.add(share.map.id);

            const sharer = await db.user.findUnique({
                where: { id: share.sharedById },
                select: { name: true, email: true },
            });

            result.push({
                id: share.map.id,
                title: share.map.title,
                permission: share.permission,
                sharedBy: sharer?.name || sharer?.email || "Unknown",
                sharedAt: share.sharedAt,
                updatedAt: share.map.updatedAt,
            });
        }

        return successResult(result);
    } catch (error) {
        return handleActionError(error);
    }
}
