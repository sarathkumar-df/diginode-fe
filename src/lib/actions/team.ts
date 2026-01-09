"use server";

/**
 * Team Management Actions
 * 
 * Server actions for team CRUD and member management.
 */

import { db } from "@/lib/db";
import { getCurrentUserId, getCurrentUserOrgId } from "@/lib/auth";
import {
    ActionResult,
    successResult,
    handleActionError,
    NotFoundError,
    ForbiddenError,
} from "@/lib/errors";

// =============================================================================
// TYPES
// =============================================================================

export interface Team {
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    memberCount: number;
    createdAt: Date;
}

export interface TeamWithMembers extends Team {
    members: TeamMemberInfo[];
}

export interface TeamMemberInfo {
    id: string;
    userId: string;
    name: string | null;
    email: string;
    role: string;
    joinedAt: Date;
}

export interface OrganizationUser {
    id: string;
    name: string | null;
    email: string;
}

// =============================================================================
// CREATE TEAM
// =============================================================================

export async function createTeam(
    name: string,
    description?: string
): Promise<ActionResult<Team>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        // Create team and add owner as member in a transaction
        const team = await db.$transaction(async (tx) => {
            const newTeam = await tx.team.create({
                data: {
                    name,
                    description: description || null,
                    ownerId: userId,
                    organizationId: orgId,
                },
            });

            // Add owner as a member with "owner" role
            await tx.teamMember.create({
                data: {
                    teamId: newTeam.id,
                    userId: userId,
                    role: "owner",
                },
            });

            return newTeam;
        });

        return successResult({
            id: team.id,
            name: team.name,
            description: team.description,
            ownerId: team.ownerId,
            memberCount: 1,
            createdAt: team.createdAt,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// LIST TEAMS
// =============================================================================

export async function listTeams(): Promise<ActionResult<Team[]>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        // Get all teams in the org where user is a member
        const teams = await db.team.findMany({
            where: {
                organizationId: orgId,
                members: {
                    some: {
                        userId: userId,
                    },
                },
            },
            include: {
                _count: {
                    select: { members: true },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return successResult(
            teams.map((team) => ({
                id: team.id,
                name: team.name,
                description: team.description,
                ownerId: team.ownerId,
                memberCount: team._count.members,
                createdAt: team.createdAt,
            }))
        );
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// GET TEAM WITH MEMBERS
// =============================================================================

export async function getTeam(
    teamId: string
): Promise<ActionResult<TeamWithMembers>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        const team = await db.team.findFirst({
            where: {
                id: teamId,
                organizationId: orgId,
            },
            include: {
                members: {
                    include: {
                        // We need to manually fetch user data
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                },
                _count: {
                    select: { members: true },
                },
            },
        });

        if (!team) {
            throw new NotFoundError("Team not found");
        }

        // Check if user is a member
        const isMember = team.members.some((m) => m.userId === userId);
        if (!isMember) {
            throw new ForbiddenError("You are not a member of this team");
        }

        // Fetch user info for all members
        const userIds = team.members.map((m) => m.userId);
        const users = await db.user.findMany({
            where: {
                id: { in: userIds },
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        const userMap = new Map(users.map((u) => [u.id, u]));

        const membersWithInfo: TeamMemberInfo[] = team.members.map((member) => {
            const user = userMap.get(member.userId);
            return {
                id: member.id,
                userId: member.userId,
                name: user?.name || null,
                email: user?.email || "Unknown",
                role: member.role,
                joinedAt: member.createdAt,
            };
        });

        return successResult({
            id: team.id,
            name: team.name,
            description: team.description,
            ownerId: team.ownerId,
            memberCount: team._count.members,
            createdAt: team.createdAt,
            members: membersWithInfo,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// ADD TEAM MEMBER
// =============================================================================

export async function addTeamMember(
    teamId: string,
    userIdToAdd: string
): Promise<ActionResult<TeamMemberInfo>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        // Verify team exists and user has permission
        const team = await db.team.findFirst({
            where: {
                id: teamId,
                organizationId: orgId,
            },
            include: {
                members: {
                    where: {
                        userId: userId,
                    },
                },
            },
        });

        if (!team) {
            throw new NotFoundError("Team not found");
        }

        const currentMember = team.members[0];
        if (!currentMember || (currentMember.role !== "owner" && currentMember.role !== "admin")) {
            throw new ForbiddenError("Only team owners or admins can add members");
        }

        // Verify user to add is in the same organization
        const userToAdd = await db.user.findFirst({
            where: {
                id: userIdToAdd,
                organizationId: orgId,
            },
        });

        if (!userToAdd) {
            throw new NotFoundError("User not found in your organization");
        }

        // Add member
        const newMember = await db.teamMember.create({
            data: {
                teamId: teamId,
                userId: userIdToAdd,
                role: "member",
            },
        });

        return successResult({
            id: newMember.id,
            userId: newMember.userId,
            name: userToAdd.name,
            email: userToAdd.email,
            role: newMember.role,
            joinedAt: newMember.createdAt,
        });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// REMOVE TEAM MEMBER
// =============================================================================

export async function removeTeamMember(
    teamId: string,
    memberUserId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        // Verify team exists
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

        const currentMember = team.members.find((m) => m.userId === userId);
        const targetMember = team.members.find((m) => m.userId === memberUserId);

        if (!targetMember) {
            throw new NotFoundError("Member not found in team");
        }

        // Can't remove the owner
        if (targetMember.role === "owner") {
            throw new ForbiddenError("Cannot remove the team owner");
        }

        // Only owner/admin can remove others, or user can remove themselves
        const canRemove =
            currentMember?.role === "owner" ||
            currentMember?.role === "admin" ||
            memberUserId === userId;

        if (!canRemove) {
            throw new ForbiddenError("You don't have permission to remove this member");
        }

        await db.teamMember.delete({
            where: {
                id: targetMember.id,
            },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// LIST ORGANIZATION USERS (for member picker)
// =============================================================================

export async function listOrganizationUsers(): Promise<ActionResult<OrganizationUser[]>> {
    try {
        const orgId = await getCurrentUserOrgId();

        const users = await db.user.findMany({
            where: {
                organizationId: orgId,
            },
            select: {
                id: true,
                name: true,
                email: true,
            },
            orderBy: {
                name: "asc",
            },
        });

        return successResult(users);
    } catch (error) {
        return handleActionError(error);
    }
}

// =============================================================================
// DELETE TEAM
// =============================================================================

export async function deleteTeam(
    teamId: string
): Promise<ActionResult<{ success: true }>> {
    try {
        const userId = await getCurrentUserId();
        const orgId = await getCurrentUserOrgId();

        const team = await db.team.findFirst({
            where: {
                id: teamId,
                organizationId: orgId,
            },
        });

        if (!team) {
            throw new NotFoundError("Team not found");
        }

        if (team.ownerId !== userId) {
            throw new ForbiddenError("Only the team owner can delete the team");
        }

        await db.team.delete({
            where: { id: teamId },
        });

        return successResult({ success: true });
    } catch (error) {
        return handleActionError(error);
    }
}
