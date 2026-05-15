export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    // Protect all routes except auth pages, share pages, and API auth/register
    "/((?!login|register|share|api/auth|api/register|api/shared-links|_next|favicon).*)",
  ],
};
