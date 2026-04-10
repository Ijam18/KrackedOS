// Query keys for feed queries.
// Shared between server (prefetch) and client (hooks) — no "use client" directive.

export const feedKeys = {
  all: ["feed"] as const,
  list: (sort: string) => [...feedKeys.all, "list", sort] as const,
  like: (appId: string) => [...feedKeys.all, "like", appId] as const,
  batchLikes: (appIds: string[]) =>
    [...feedKeys.all, "likes", ...appIds.toSorted()] as const,
};
