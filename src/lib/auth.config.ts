import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
            const isOnEditor = nextUrl.pathname.startsWith("/editor");

            if (isOnDashboard || isOnEditor) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
