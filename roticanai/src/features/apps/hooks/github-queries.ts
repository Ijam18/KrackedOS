"use client";

import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export type GitHubConnectionStatus =
  | "not_connected"
  | "reconnect_required"
  | "ready";

export type GitHubRepoLinkStatus = "unlinked" | "linked" | "invalid";

export interface LinkedGitHubRepo {
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
  linkedAt: string | null;
  lastPushedAt: string | null;
}

export interface AppGitHubStatusResponse {
  connectionStatus: GitHubConnectionStatus;
  repoLinkStatus: GitHubRepoLinkStatus;
  linkedRepo: LinkedGitHubRepo | null;
  canPush: boolean;
  viewerLogin: string | null;
}

export interface PushGitHubRepoResponse extends AppGitHubStatusResponse {
  pushResult: {
    commitSha: string;
    commitUrl: string;
    branch: string;
    pushedAt: string;
  };
}

export interface LinkGitHubRepoPayload {
  mode: "create";
  repoName: string;
  description?: string;
}

export class GitHubApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "GitHubApiError";
  }
}

export const githubKeys = {
  all: ["github"] as const,
  app: (appId: string) => [...githubKeys.all, "app", appId] as const,
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let error = "Request failed";
    let code: string | undefined;

    try {
      const body = (await response.json()) as { error?: string; code?: string };
      error = body.error ?? error;
      code = body.code;
    } catch {}

    throw new GitHubApiError(error, response.status, code);
  }

  return (await response.json()) as T;
}

async function fetchGitHubStatus(
  appId: string,
): Promise<AppGitHubStatusResponse> {
  const response = await fetch(`/api/apps/${appId}/github`, {
    method: "GET",
    cache: "no-store",
  });

  return parseResponse<AppGitHubStatusResponse>(response);
}

async function linkGitHubRepo(
  appId: string,
  payload: LinkGitHubRepoPayload,
): Promise<AppGitHubStatusResponse> {
  const response = await fetch(`/api/apps/${appId}/github/link`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseResponse<AppGitHubStatusResponse>(response);
}

async function unlinkGitHubRepo(appId: string): Promise<void> {
  const response = await fetch(`/api/apps/${appId}/github`, {
    method: "DELETE",
  });

  await parseResponse<{ success: boolean }>(response);
}

async function pushGitHubRepo(appId: string): Promise<PushGitHubRepoResponse> {
  const response = await fetch(`/api/apps/${appId}/github/push`, {
    method: "POST",
  });

  return parseResponse<PushGitHubRepoResponse>(response);
}

export function useAppGitHubStatusQuery(
  appId: string,
  enabled = true,
): UseQueryResult<AppGitHubStatusResponse, GitHubApiError> {
  return useQuery({
    queryKey: githubKeys.app(appId),
    queryFn: () => fetchGitHubStatus(appId),
    enabled,
    staleTime: 15_000,
  });
}

export function useLinkGitHubRepoMutation(
  appId: string,
): UseMutationResult<
  AppGitHubStatusResponse,
  GitHubApiError,
  LinkGitHubRepoPayload
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => linkGitHubRepo(appId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(githubKeys.app(appId), data);
    },
  });
}

export function useUnlinkGitHubRepoMutation(
  appId: string,
): UseMutationResult<void, GitHubApiError, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => unlinkGitHubRepo(appId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubKeys.app(appId) });
    },
  });
}

export function usePushGitHubRepoMutation(
  appId: string,
): UseMutationResult<PushGitHubRepoResponse, GitHubApiError, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => pushGitHubRepo(appId),
    onSuccess: (data) => {
      queryClient.setQueryData(githubKeys.app(appId), {
        connectionStatus: data.connectionStatus,
        repoLinkStatus: data.repoLinkStatus,
        linkedRepo: data.linkedRepo,
        canPush: data.canPush,
        viewerLogin: data.viewerLogin,
      } satisfies AppGitHubStatusResponse);
    },
  });
}
