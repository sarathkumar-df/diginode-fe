/**
 * Extended Auth Type Definitions
 * 
 * Augments NextAuth types to include custom session properties
 * for multi-tenancy and Entra ID integration.
 */

import type { DefaultSession } from "next-auth";

// =============================================================================
// EXTENDED USER TYPE
// =============================================================================
declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            entraObjectId: string;
            organizationId: string;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        entraObjectId?: string;
        organizationId?: string;
    }
}

// =============================================================================
// EXTENDED JWT TYPE
// =============================================================================
declare module "next-auth/jwt" {
    interface JWT {
        id?: string;
        entraObjectId?: string;
        organizationId?: string;
    }
}

// =============================================================================
// USER ROLES (For future RBAC implementation)
// =============================================================================
export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface UserWithOrganization {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    entraObjectId: string;
    organizationId: string;
    role?: UserRole;
}
