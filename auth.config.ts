import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config. No database imports here.
 * Used by middleware.ts and merged into the full config in auth.ts.
 */

const PUBLIC_PATHS = ["/login", "/signup"];

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isPublicPath = PUBLIC_PATHS.some(
        (p) => path === p || path.startsWith(`${p}/`)
      );

      // Already logged in and trying to visit login/signup → bounce to dashboard
      if (isLoggedIn && isPublicPath) {
        return Response.redirect(new URL("/", nextUrl));
      }

      // Public path, not logged in → allow
      if (isPublicPath) {
        return true;
      }

      // Protected path → must be logged in
      // Returning false redirects to the signIn page configured above.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  providers: [], // Real providers added in auth.ts
} satisfies NextAuthConfig;