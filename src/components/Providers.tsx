"use client";

import { SessionProvider } from "next-auth/react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <WorkspaceProvider>{children}</WorkspaceProvider>
    </SessionProvider>
  );
}
