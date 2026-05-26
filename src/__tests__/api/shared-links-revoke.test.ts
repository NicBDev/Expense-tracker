/**
 * Tests for PATCH /api/shared-links?id=...&workspaceId=... (revoke a link)
 *
 * Key security invariants verified:
 *   1. Both id and workspaceId are required
 *   2. Workspace membership is checked BEFORE the link is fetched —
 *      non-members cannot tell whether a link ID exists
 *   3. Only the link creator or a workspace owner can revoke
 *   4. Members cannot revoke other users' links
 */

import { NextResponse } from "next/server";
import { PATCH } from "@/app/api/shared-links/route";
import {
  authedAs,
  notAuthed,
  memberWithRole,
  notAMember,
  makeSharedLink,
} from "../helpers/mocks";

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("@/lib/apiHelpers", () => ({
  requireAuth: jest.fn(),
  requireWorkspaceMember: jest.fn(),
  isErrorResponse: (val: unknown) => val instanceof NextResponse,
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    sharedLink: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import * as apiHelpers from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

const mockRequireAuth = apiHelpers.requireAuth as jest.Mock;
const mockRequireWorkspaceMember = apiHelpers.requireWorkspaceMember as jest.Mock;
const mockFindUnique = prisma.sharedLink.findUnique as jest.Mock;
const mockUpdate = prisma.sharedLink.update as jest.Mock;

function revokeRequest(params: { id?: string; workspaceId?: string }) {
  const qs = new URLSearchParams();
  if (params.id) qs.set("id", params.id);
  if (params.workspaceId) qs.set("workspaceId", params.workspaceId);
  return new Request(`http://localhost/api/shared-links?${qs.toString()}`, {
    method: "PATCH",
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/shared-links (revoke)
// ─────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/shared-links (revoke)", () => {
  describe("request validation", () => {
    it("returns 400 when id is missing", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));

      const req = revokeRequest({ workspaceId: "ws1" }); // no id
      const res = await PATCH(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/id/i);
    });

    it("returns 400 when workspaceId is missing", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));

      const req = revokeRequest({ id: "link1" }); // no workspaceId
      const res = await PATCH(req);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/workspaceId/i);
    });
  });

  describe("authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockRequireAuth.mockImplementation(notAuthed());

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(401);
    });
  });

  describe("authorization order — membership checked before link fetch", () => {
    it("returns 403 when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("outsider"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(403);
    });

    it("does NOT query the database when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("outsider"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      await PATCH(req);

      // Membership failure must short-circuit before any DB access
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("role-based permissions", () => {
    it("returns 403 when a member tries to revoke another user's link", async () => {
      mockRequireAuth.mockImplementation(authedAs("user2")); // not the creator
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeSharedLink({ userId: "user1" })); // created by user1

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/revoke/i);
    });

    it("allows a member to revoke their own link", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeSharedLink({ userId: "user1" }));
      mockUpdate.mockResolvedValue({ id: "link1", active: false });

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.active).toBe(false);
    });

    it("allows an owner to revoke any link in the workspace", async () => {
      mockRequireAuth.mockImplementation(authedAs("owner1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("owner"));
      mockFindUnique.mockResolvedValue(makeSharedLink({ userId: "user1" })); // created by someone else
      mockUpdate.mockResolvedValue({ id: "link1", active: false });

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(200);
    });
  });

  describe("workspace scoping", () => {
    it("fetches the link with workspaceId filter to prevent cross-workspace access", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeSharedLink());
      mockUpdate.mockResolvedValue({ id: "link1", active: false });

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      await PATCH(req);

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws1" }) })
      );
    });

    it("returns 404 when link ID does not exist in this workspace", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(null); // workspace-scoped query found nothing

      const req = revokeRequest({ id: "link1", workspaceId: "ws1" });
      const res = await PATCH(req);

      expect(res.status).toBe(404);
    });
  });
});
