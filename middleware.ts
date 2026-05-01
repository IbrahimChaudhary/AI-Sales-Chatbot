import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately, including /api/auth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - any file with an extension (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};