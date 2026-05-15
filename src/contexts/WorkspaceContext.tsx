"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

export interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  expenseCount: number;
  memberCount: number;
}

interface WorkspaceContextValue {
  workspaceId: string | null;
  setWorkspaceId: (id: string) => void;
  workspaces: WorkspaceInfo[];
  currentWorkspace: WorkspaceInfo | null;
  loadingWorkspaces: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue>({
  workspaceId: null,
  setWorkspaceId: () => {},
  workspaces: [],
  currentWorkspace: null,
  loadingWorkspaces: true,
  refreshWorkspaces: async () => {},
});

const STORAGE_KEY = "spendwise-workspace-id";

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [workspaceId, _setWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const setWorkspaceId = useCallback((id: string) => {
    _setWorkspaceId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return;
      const data: WorkspaceInfo[] = await res.json();
      setWorkspaces(data);

      // Restore or auto-select workspace
      const stored = localStorage.getItem(STORAGE_KEY);
      const valid = stored && data.some((w) => w.id === stored);
      if (valid) {
        _setWorkspaceId(stored);
      } else if (data.length > 0) {
        _setWorkspaceId(data[0].id);
        localStorage.setItem(STORAGE_KEY, data[0].id);
      }
    } finally {
      setLoadingWorkspaces(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      setLoadingWorkspaces(true);
      refreshWorkspaces();
    } else if (status === "unauthenticated") {
      setLoadingWorkspaces(false);
    }
  }, [status, refreshWorkspaces]);

  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) ?? null;

  return (
    <WorkspaceContext.Provider
      value={{ workspaceId, setWorkspaceId, workspaces, currentWorkspace, loadingWorkspaces, refreshWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
