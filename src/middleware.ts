export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    /*
     * Only protect page routes. API routes handle their own auth via
     * requireAuth() / requireWorkspaceMember() in apiHelpers.ts.
     * Exclude: API routes, Next.js internals, static files, known public pages.
     */
    "/((?!api/|_next/static|_next/image|favicon\\.ico|login|register|share|test-data).*)",
  ],
};
