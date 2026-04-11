"use client";

import {
  FetchHttpClient,
  Headers,
  HttpBody,
  HttpClient,
  HttpClientResponse,
} from "@effect/platform";
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Effect } from "effect";
import type { FileTreeNode } from "./use-sandbox-files";

// Query key factory for consistent key management
export const sandboxKeys = {
  all: ["sandbox"] as const,
  files: (sessionId: string) =>
    [...sandboxKeys.all, "files", sessionId] as const,
  fileContent: (sessionId: string, path: string) =>
    [...sandboxKeys.all, "file-content", sessionId, path] as const,
};

export const runWithHttp = <A, E>(
  effect: Effect.Effect<A, E, HttpClient.HttpClient>,
) => effect.pipe(Effect.provide(FetchHttpClient.layer), Effect.runPromise);

// ============================================================================
// Fetch Functions
// ============================================================================

const fetchSandboxFiles = (sessionId: string) =>
  HttpClient.get(`/api/files?sessionId=${sessionId}&list=true&path=.`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
  ) as Effect.Effect<FileTreeNode[], Error, HttpClient.HttpClient>;

export const fetchFileContent = (sessionId: string, path: string) =>
  HttpClient.get(
    `/api/files?sessionId=${sessionId}&path=${encodeURIComponent(path)}`,
  ).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.flatMap((res) => res.json),
    Effect.map((data) => (data as { content?: string }).content || ""),
  ) as Effect.Effect<string, Error, HttpClient.HttpClient>;

const saveFileContent = (params: {
  sessionId: string;
  path: string;
  content: string;
}) =>
  Effect.gen(function* () {
    const client = yield* HttpClient.HttpClient;
    const response = yield* client.put("/api/files", {
      body: HttpBody.unsafeJson(params),
      headers: Headers.fromInput({ "content-type": "application/json" }),
    });
    yield* HttpClientResponse.filterStatusOk(response);
  });

const destroySandbox = (sessionId: string) =>
  HttpClient.del(`/api/sandbox?sessionId=${sessionId}`).pipe(
    Effect.flatMap(HttpClientResponse.filterStatusOk),
    Effect.asVoid,
  ) as Effect.Effect<void, Error, HttpClient.HttpClient>;

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetches the file tree for a sandbox
 */
export function useSandboxFilesQuery(
  sessionId: string | null,
  isReady: boolean,
): UseQueryResult<FileTreeNode[], Error> {
  return useQuery({
    queryKey: sandboxKeys.files(sessionId || ""),
    queryFn: () => {
      if (!sessionId) throw new Error("No session ID");
      return runWithHttp(fetchSandboxFiles(sessionId));
    },
    enabled: !!sessionId && isReady,
  });
}

/**
 * Fetches content for a single file
 */
export function useFileContentQuery(
  sessionId: string,
  path: string | null,
  enabled = true,
): UseQueryResult<string, Error> {
  return useQuery({
    queryKey: sandboxKeys.fileContent(sessionId, path || ""),
    queryFn: () => {
      if (!path) throw new Error("No path provided");
      return runWithHttp(fetchFileContent(sessionId, path));
    },
    enabled: enabled && !!path,
    staleTime: 0, // Always refetch file content as it may have changed externally
  });
}

// ============================================================================
// Mutation Hooks
// ============================================================================

interface SaveFileMutationParams {
  path: string;
  content: string;
}

/**
 * Saves file content to the sandbox
 */
export function useSaveFileMutation(
  sessionId: string,
): UseMutationResult<void, Error, SaveFileMutationParams> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: SaveFileMutationParams) =>
      runWithHttp(saveFileContent({ sessionId, ...params })),
    onSuccess: (_data, variables) => {
      // Update the cached file content
      queryClient.setQueryData(
        sandboxKeys.fileContent(sessionId, variables.path),
        variables.content,
      );
    },
  });
}

/**
 * Destroys a sandbox
 */
export function useDestroySandboxMutation(
  sessionId: string,
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => runWithHttp(destroySandbox(sessionId)),
    onSuccess: () => {
      // Invalidate all sandbox-related queries
      queryClient.invalidateQueries({ queryKey: sandboxKeys.all });
    },
  });
}
