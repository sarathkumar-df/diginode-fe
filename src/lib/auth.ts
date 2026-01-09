/**
 * NextAuth v5 Configuration
 * 
 * Supports both Microsoft Entra ID SSO and Email/Password auth.
 */

import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";

// Import custom types
import "@/lib/types/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(db),
    providers: [
        // Email/Password Authentication
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db.user.findUnique({
                    where: { email },
                    include: { organization: true },
                });

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    entraObjectId: user.entraObjectId || undefined,
                    organizationId: user.organizationId,
                };
            },
        }),

        // Microsoft Entra ID SSO (optional)
        ...(process.env.AUTH_MICROSOFT_ENTRA_ID_ID
            ? [
                MicrosoftEntraID({
                    clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
                    clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
                    issuer: `https://login.microsoftonline.com/${process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID}/v2.0`,
                    authorization: {
                        params: {
                            scope: "openid profile email User.Read",
                            prompt: "select_account",
                        },
                    },
                }),
            ]
            : []),
    ],

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },

    callbacks: {
        async jwt({ token, user, account, profile }): Promise<JWT> {
            // On initial sign in
            if (user) {
                // For credentials provider, user already has organizationId
                if (account?.provider === "credentials") {
                    token.id = user.id;
                    token.entraObjectId = (user as { entraObjectId?: string }).entraObjectId;
                    token.organizationId = (user as { organizationId?: string }).organizationId;
                }
                // For Entra ID provider
                else if (account?.provider === "microsoft-entra-id" && profile) {
                    const entraObjectId = (profile as { oid?: string }).oid || profile.sub || "";
                    const tenantId = (profile as { tid?: string }).tid || process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID || "";

                    let organization = await db.organization.findUnique({
                        where: { tenantId },
                    });

                    if (!organization) {
                        organization = await db.organization.create({
                            data: {
                                name: `Organization ${tenantId.substring(0, 8)}`,
                                tenantId,
                            },
                        });
                    }

                    const dbUser = await db.user.upsert({
                        where: { email: user.email! },
                        update: {
                            name: user.name,
                            image: user.image,
                            entraObjectId,
                            organizationId: organization.id,
                        },
                        create: {
                            email: user.email!,
                            name: user.name,
                            image: user.image,
                            entraObjectId,
                            organizationId: organization.id,
                        },
                    });

                    token.id = dbUser.id;
                    token.entraObjectId = dbUser.entraObjectId || undefined;
                    token.organizationId = dbUser.organizationId;
                }
            }

            return token;
        },

        async session({ session, token }): Promise<Session> {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.entraObjectId = (token.entraObjectId as string) || "";
                session.user.organizationId = token.organizationId as string;
            }
            return session;
        },
    },

    events: {
        async signIn({ user, account }) {
            console.log(`[Auth] User signed in: ${user.email} via ${account?.provider}`);
        },
        async signOut() {
            console.log(`[Auth] User signed out`);
        },
    },

    debug: process.env.NODE_ENV === "development",
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export async function getCurrentSession() {
    const session = await auth();

    if (!session?.user) {
        throw new Error("Unauthorized: No active session");
    }

    return session;
}

export async function getCurrentOrganizationId(): Promise<string> {
    const session = await getCurrentSession();
    return session.user.organizationId;
}

export async function getCurrentUserId(): Promise<string> {
    const session = await getCurrentSession();
    return session.user.id;
}
