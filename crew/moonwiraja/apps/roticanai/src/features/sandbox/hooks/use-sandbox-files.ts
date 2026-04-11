"use client";

import { useSandboxFilesQuery } from "./queries";

export interface FileTreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileTreeNode[];
}

export interface UseSandboxFilesResult {
  files: FileTreeNode[];
  isLoading: boolean;
  error: string | null;
  refreshFiles: () => Promise<void>;
}

export function useSandboxFiles(
  sessionId: string | null,
  isReady: boolean,
): UseSandboxFilesResult {
  const { data, isLoading, error, refetch } = useSandboxFilesQuery(
    sessionId,
    isReady,
  );

  return {
    files: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refreshFiles: async () => {
      await refetch();
    },
  };
}
