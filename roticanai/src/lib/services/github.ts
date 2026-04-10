import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import { db } from "@/db";
import { type App, account } from "@/db/schema";
import { GITHUB_PUSH_SCOPES } from "@/lib/core/auth/github-scopes";
import { ConflictError, ValidationError } from "@/lib/effect/errors";
import { exec, listFiles } from "@/lib/services/sandbox";
import type { SandboxFile } from "@/lib/services/sandbox/types";

const GITHUB_API_BASE = "https://api.github.com";

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

interface GitHubAccountRecord {
  accessToken: string | null;
  scope: string | null;
}

interface GitHubUser {
  login: string;
  id: number;
  type: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  default_branch: string | null;
  private: boolean;
  owner: {
    login: string;
    type: string;
  };
}

interface GitHubCommit {
  sha: string;
  tree: {
    sha: string;
  };
}

export interface PushGitHubRepoResult {
  commitSha: string;
  commitUrl: string;
  branch: string;
  pushedAt: string;
}

interface PushSnapshotEntry {
  path: string;
  contentBase64: string;
}

export interface GitHubRepoLink {
  repoId: string;
  owner: string;
  name: string;
  url: string;
  defaultBranch: string;
}

const PUSH_SCOPE_ALIASES = new Set(["public_repo", "repo"]);

const getStoredRepoFields = (app: App) => {
  if (
    !app.githubRepoId ||
    !app.githubRepoOwner ||
    !app.githubRepoName ||
    !app.githubRepoUrl ||
    !app.githubDefaultBranch
  ) {
    return null;
  }

  return {
    repoId: app.githubRepoId,
    owner: app.githubRepoOwner,
    name: app.githubRepoName,
    url: app.githubRepoUrl,
    defaultBranch: app.githubDefaultBranch,
  };
};

const parseScopes = (scope: string | null) =>
  new Set(
    (scope ?? "")
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter(Boolean),
  );

const hasPushScope = (scope: string | null) => {
  const scopes = parseScopes(scope);
  return [...PUSH_SCOPE_ALIASES].some((value) => scopes.has(value));
};

const toLinkedRepo = (app: App): LinkedGitHubRepo | null => {
  const repo = getStoredRepoFields(app);
  if (!repo) return null;

  return {
    owner: repo.owner,
    name: repo.name,
    url: repo.url,
    defaultBranch: repo.defaultBranch,
    linkedAt: app.githubLinkedAt?.toISOString() ?? null,
    lastPushedAt: app.githubLastPushedAt?.toISOString() ?? null,
  };
};

const shellEscape = (value: string) => `'${value.replaceAll("'", "'\"'\"'")}'`;

async function githubFetch<T>(
  token: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "myvibe-github-integration",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API ${response.status} ${response.statusText}: ${body || "Unknown error"}`,
    );
  }

  return (await response.json()) as T;
}

export async function getGitHubAccountForUser(
  userId: string,
): Promise<GitHubAccountRecord | null> {
  const result = await db.query.account.findFirst({
    where: and(eq(account.userId, userId), eq(account.providerId, "github")),
    columns: {
      accessToken: true,
      scope: true,
    },
  });

  return result ?? null;
}

export async function getGitHubCapability(userId: string): Promise<{
  connectionStatus: GitHubConnectionStatus;
  token: string | null;
}> {
  const githubAccount = await getGitHubAccountForUser(userId);

  if (!githubAccount?.accessToken) {
    return { connectionStatus: "not_connected", token: null };
  }

  if (!hasPushScope(githubAccount.scope)) {
    return { connectionStatus: "reconnect_required", token: null };
  }

  return { connectionStatus: "ready", token: githubAccount.accessToken };
}

export async function getGitHubViewer(token: string): Promise<GitHubUser> {
  return githubFetch<GitHubUser>(token, "/user");
}

export async function getAppGitHubStatus(
  app: App,
  userId: string,
): Promise<AppGitHubStatusResponse> {
  const capability = await getGitHubCapability(userId);
  const linkedRepo = toLinkedRepo(app);

  if (capability.connectionStatus !== "ready" || !capability.token) {
    return {
      connectionStatus: capability.connectionStatus,
      repoLinkStatus: linkedRepo ? "linked" : "unlinked",
      linkedRepo,
      canPush: false,
      viewerLogin: null,
    };
  }

  let viewer: GitHubUser;
  try {
    viewer = await getGitHubViewer(capability.token);
  } catch {
    return {
      connectionStatus: "reconnect_required",
      repoLinkStatus: linkedRepo ? "linked" : "unlinked",
      linkedRepo,
      canPush: false,
      viewerLogin: null,
    };
  }

  let repoLinkStatus: GitHubRepoLinkStatus = linkedRepo ? "linked" : "unlinked";

  if (linkedRepo) {
    try {
      await getValidatedPersonalRepo(
        capability.token,
        linkedRepo.owner,
        linkedRepo.name,
      );
    } catch {
      repoLinkStatus = "invalid";
    }
  }

  return {
    connectionStatus: capability.connectionStatus,
    repoLinkStatus,
    linkedRepo,
    canPush:
      capability.connectionStatus === "ready" && repoLinkStatus === "linked",
    viewerLogin: viewer.login,
  };
}

export async function requireGitHubPushAccess(userId: string): Promise<string> {
  const capability = await getGitHubCapability(userId);

  if (capability.connectionStatus === "not_connected") {
    throw new ConflictError({
      message: "Connect GitHub to push this app",
      code: "GITHUB_NOT_CONNECTED",
    });
  }

  if (capability.connectionStatus === "reconnect_required") {
    throw new ConflictError({
      message: "Reconnect GitHub to grant repository access",
      code: "GITHUB_RECONNECT_REQUIRED",
    });
  }

  if (!capability.token) {
    throw new ConflictError({
      message: "GitHub access token is unavailable",
      code: "GITHUB_TOKEN_UNAVAILABLE",
    });
  }

  return capability.token;
}

export async function createPersonalPublicRepo(
  token: string,
  repoName: string,
  description?: string,
): Promise<GitHubRepoLink> {
  const trimmedName = repoName.trim();
  if (!trimmedName) {
    throw new ValidationError({
      field: "repoName",
      message: "Repository name is required",
    });
  }

  const created = await githubFetch<GitHubRepo>(token, "/user/repos", {
    method: "POST",
    body: JSON.stringify({
      name: trimmedName,
      description: description?.trim() || undefined,
      private: false,
      auto_init: true,
    }),
  });

  if (!created.default_branch) {
    throw new ConflictError({
      message: "New repository does not have a default branch",
      code: "GITHUB_REPO_NO_DEFAULT_BRANCH",
    });
  }

  return {
    repoId: String(created.id),
    owner: created.owner.login,
    name: created.name,
    url: created.html_url,
    defaultBranch: created.default_branch,
  };
}

export async function getValidatedPersonalRepo(
  token: string,
  owner: string,
  repoName: string,
): Promise<GitHubRepoLink> {
  const viewer = await getGitHubViewer(token);
  const repo = await githubFetch<GitHubRepo>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
  );

  if (repo.owner.type !== "User" || repo.owner.login !== viewer.login) {
    throw new ConflictError({
      message:
        "Only personal repositories owned by your GitHub account are supported",
      code: "GITHUB_PERSONAL_REPO_REQUIRED",
    });
  }

  if (repo.private) {
    throw new ConflictError({
      message: "Private repositories are not supported yet",
      code: "GITHUB_PUBLIC_REPO_REQUIRED",
    });
  }

  if (!repo.default_branch) {
    throw new ConflictError({
      message: "Repository must have a default branch before linking",
      code: "GITHUB_REPO_NO_DEFAULT_BRANCH",
    });
  }

  return {
    repoId: String(repo.id),
    owner: repo.owner.login,
    name: repo.name,
    url: repo.html_url,
    defaultBranch: repo.default_branch,
  };
}

async function getBranchHead(
  token: string,
  owner: string,
  repoName: string,
  branch: string,
): Promise<string> {
  const response = await githubFetch<{ object: { sha: string } }>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/ref/heads/${encodeURIComponent(branch)}`,
  );

  return response.object.sha;
}

async function getCommit(
  token: string,
  owner: string,
  repoName: string,
  sha: string,
): Promise<GitHubCommit> {
  return githubFetch<GitHubCommit>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/commits/${sha}`,
  );
}

async function createBlob(
  token: string,
  owner: string,
  repoName: string,
  contentBase64: string,
): Promise<string> {
  const response = await githubFetch<{ sha: string }>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/blobs`,
    {
      method: "POST",
      body: JSON.stringify({
        content: contentBase64,
        encoding: "base64",
      }),
    },
  );

  return response.sha;
}

async function createTree(
  token: string,
  owner: string,
  repoName: string,
  entries: Array<{ path: string; sha: string }>,
): Promise<string> {
  const response = await githubFetch<{ sha: string }>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/trees`,
    {
      method: "POST",
      body: JSON.stringify({
        tree: entries.map((entry) => ({
          path: entry.path,
          mode: "100644",
          type: "blob",
          sha: entry.sha,
        })),
      }),
    },
  );

  return response.sha;
}

async function createCommit(
  token: string,
  owner: string,
  repoName: string,
  message: string,
  treeSha: string,
  parentSha: string,
): Promise<string> {
  const response = await githubFetch<{ sha: string }>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/commits`,
    {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: treeSha,
        parents: [parentSha],
      }),
    },
  );

  return response.sha;
}

async function updateBranchHead(
  token: string,
  owner: string,
  repoName: string,
  branch: string,
  commitSha: string,
): Promise<void> {
  await githubFetch<{ ref: string }>(
    token,
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}/git/refs/heads/${encodeURIComponent(branch)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: commitSha,
        force: false,
      }),
    },
  );
}

function flattenFiles(entries: SandboxFile[]): string[] {
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isDir) {
      if (entry.children) {
        files.push(...flattenFiles(entry.children));
      }
      continue;
    }

    files.push(entry.path);
  }

  return files;
}

async function buildSandboxSnapshot(
  sessionId: string,
): Promise<PushSnapshotEntry[]> {
  const tree = await Effect.runPromise(listFiles(sessionId, "."));
  const filePaths = flattenFiles(tree);

  const excludedPrefixes = [
    ".git/",
    "node_modules/",
    ".next/",
    "dist/",
    "coverage/",
  ];

  const filteredPaths = filePaths.filter(
    (path) => !excludedPrefixes.some((prefix) => path.startsWith(prefix)),
  );

  return Promise.all(
    filteredPaths.map(async (path) => {
      const result = await exec(
        sessionId,
        `base64 -w 0 ${shellEscape(path)}`,
      ).pipe(Effect.runPromise);

      if (!result.success) {
        throw new Error(result.stderr || `Failed to read ${path}`);
      }

      return {
        path,
        contentBase64: result.stdout.trim(),
      };
    }),
  );
}

export async function pushAppToLinkedRepo(
  token: string,
  app: App,
): Promise<PushGitHubRepoResult> {
  const storedRepo = getStoredRepoFields(app);

  if (!storedRepo) {
    throw new ConflictError({
      message: "Link a GitHub repository before pushing",
      code: "GITHUB_REPO_NOT_LINKED",
    });
  }

  const owner = storedRepo.owner;
  const repoName = storedRepo.name;
  const branch = storedRepo.defaultBranch;

  await getValidatedPersonalRepo(token, owner, repoName);

  let snapshot: PushSnapshotEntry[];
  try {
    snapshot = await buildSandboxSnapshot(app.id);
  } catch {
    throw new ConflictError({
      message: "App workspace must be available before pushing to GitHub",
      code: "SANDBOX_UNAVAILABLE",
    });
  }

  const headSha = await getBranchHead(token, owner, repoName, branch);
  await getCommit(token, owner, repoName, headSha);

  const blobs = await Promise.all(
    snapshot.map(async (file) => ({
      path: file.path,
      sha: await createBlob(token, owner, repoName, file.contentBase64),
    })),
  );

  const treeSha = await createTree(token, owner, repoName, blobs);
  const commitMessage = `roticanai: update ${app.title?.trim() || app.id}`;
  const commitSha = await createCommit(
    token,
    owner,
    repoName,
    commitMessage,
    treeSha,
    headSha,
  );
  await updateBranchHead(token, owner, repoName, branch, commitSha);

  const pushedAt = new Date().toISOString();

  return {
    commitSha,
    commitUrl: `https://github.com/${owner}/${repoName}/commit/${commitSha}`,
    branch,
    pushedAt,
  };
}

export function buildGitHubReconnectScopes() {
  return [...GITHUB_PUSH_SCOPES];
}
