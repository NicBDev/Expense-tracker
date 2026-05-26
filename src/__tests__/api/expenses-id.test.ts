/**
 * @jest-environment node
 *
 * Tests for PATCH and DELETE /api/expenses/[id]
 *
 * Key security invariants verified:
 *   1. workspaceId is required — no fishing for valid IDs without it
 *   2. Workspace membership is checked BEFORE the expense is fetched —
 *      non-members cannot tell whether an expense ID exists
 *   3. Viewers cannot mutate expenses
 *   4. Members can only edit/delete their own expenses
 *   5. Owners can edit/delete any expense in their workspace
 */

import { NextResponse } from "next/server";
import { PATCH, DELETE } from "@/app/api/expenses/[id]/route";
import {
  authedAs,
  notAuthed,
  memberWithRole,
  notAMember,
  makeExpense,
  patchRequest,
  deleteRequest,
} from "../helpers/mocks";

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock("@/lib/apiHelpers", () => ({
  requireAuth: jest.fn(),
  requireWorkspaceMember: jest.fn(),
  isErrorResponse: (val: unknown) => val instanceof NextResponse,
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    expense: {
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

// ─── Imports after mocks ──────────────────────────────────────────────────────

import * as apiHelpers from "@/lib/apiHelpers";
import { prisma } from "@/lib/prisma";

const mockRequireAuth = apiHelpers.requireAuth as jest.Mock;
const mockRequireWorkspaceMember = apiHelpers.requireWorkspaceMember as jest.Mock;
const mockFindUnique = prisma.expense.findUnique as jest.Mock;
const mockUpdate = prisma.expense.update as jest.Mock;
const mockDelete = prisma.expense.delete as jest.Mock;

const PARAMS = { params: { id: "exp1" } };

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/expenses/[id]
// ─────────────────────────────────────────────────────────────────────────────

describe("PATCH /api/expenses/[id]", () => {
  describe("request validation", () => {
    it("returns 400 when workspaceId is missing from body", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));

      const req = patchRequest({ amount: 99 }); // no workspaceId
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/workspaceId/i);
    });
  });

  describe("authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockRequireAuth.mockImplementation(notAuthed());

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(401);
    });

    it("does not fetch the expense when unauthenticated", async () => {
      mockRequireAuth.mockImplementation(notAuthed());

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      await PATCH(req, PARAMS);

      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("authorization order — membership checked before expense fetch", () => {
    it("returns 403 when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(403);
    });

    it("does NOT query the database when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("outsider"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      await PATCH(req, PARAMS);

      // Membership failure must short-circuit before any DB access
      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("role-based permissions", () => {
    it("returns 403 when user has viewer role", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("viewer"));

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.error).toMatch(/viewer/i);
    });

    it("returns 403 when a member tries to edit another user's expense", async () => {
      mockRequireAuth.mockImplementation(authedAs("user2")); // not the creator
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" })); // owned by user1

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(403);
    });

    it("allows a member to edit their own expense", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" }));
      mockUpdate.mockResolvedValue({ ...makeExpense(), amount: 99 });

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(200);
    });

    it("allows an owner to edit any expense in the workspace", async () => {
      mockRequireAuth.mockImplementation(authedAs("owner1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("owner"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" })); // owned by someone else
      mockUpdate.mockResolvedValue({ ...makeExpense(), amount: 99 });

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(200);
    });
  });

  describe("workspace scoping", () => {
    it("fetches expense with workspaceId filter to prevent cross-workspace access", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense());
      mockUpdate.mockResolvedValue(makeExpense());

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      await PATCH(req, PARAMS);

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws1" }) })
      );
    });

    it("returns 404 when expense belongs to a different workspace", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(null); // workspace-scoped query found nothing

      const req = patchRequest({ workspaceId: "ws1", amount: 99 });
      const res = await PATCH(req, PARAMS);

      expect(res.status).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/expenses/[id]
// ─────────────────────────────────────────────────────────────────────────────

describe("DELETE /api/expenses/[id]", () => {
  describe("request validation", () => {
    it("returns 400 when workspaceId query param is missing", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));

      const req = deleteRequest("http://localhost/api/expenses/exp1"); // no ?workspaceId
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/workspaceId/i);
    });
  });

  describe("authentication", () => {
    it("returns 401 when user is not authenticated", async () => {
      mockRequireAuth.mockImplementation(notAuthed());

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(401);
    });
  });

  describe("authorization order — membership checked before expense fetch", () => {
    it("returns 403 when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("outsider"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(403);
    });

    it("does NOT query the database when user is not a workspace member", async () => {
      mockRequireAuth.mockImplementation(authedAs("outsider"));
      mockRequireWorkspaceMember.mockImplementation(notAMember());

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      await DELETE(req, PARAMS);

      expect(mockFindUnique).not.toHaveBeenCalled();
    });
  });

  describe("role-based permissions", () => {
    it("returns 403 when user has viewer role", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("viewer"));

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(403);
    });

    it("returns 403 when a member tries to delete another user's expense", async () => {
      mockRequireAuth.mockImplementation(authedAs("user2"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" }));

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(403);
    });

    it("returns 204 when a member deletes their own expense", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" }));
      mockDelete.mockResolvedValue({});

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(204);
    });

    it("returns 204 when an owner deletes another user's expense", async () => {
      mockRequireAuth.mockImplementation(authedAs("owner1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("owner"));
      mockFindUnique.mockResolvedValue(makeExpense({ userId: "user1" }));
      mockDelete.mockResolvedValue({});

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(204);
    });
  });

  describe("workspace scoping", () => {
    it("fetches expense with workspaceId filter to prevent cross-workspace access", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(makeExpense());
      mockDelete.mockResolvedValue({});

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      await DELETE(req, PARAMS);

      expect(mockFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ workspaceId: "ws1" }) })
      );
    });

    it("returns 404 when expense ID does not exist in this workspace", async () => {
      mockRequireAuth.mockImplementation(authedAs("user1"));
      mockRequireWorkspaceMember.mockImplementation(memberWithRole("member"));
      mockFindUnique.mockResolvedValue(null);

      const req = deleteRequest("http://localhost/api/expenses/exp1?workspaceId=ws1");
      const res = await DELETE(req, PARAMS);

      expect(res.status).toBe(404);
    });
  });
});
