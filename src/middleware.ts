export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all routes except auth pages, share pages, and API auth
    "/((?!login|register|share|api/auth|api/shared-links|_next|favicon).*)",
  ],
};
