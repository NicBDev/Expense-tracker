"use client";

import { SessionProvider } from "next-auth/react";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/ToastContainer";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <WorkspaceProvider>{children}</WorkspaceProvider>
        <ToastContainer />
      </ToastProvider>
    </SessionProvider>
  );
}
