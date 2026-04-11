import { Schema } from "effect";

// ============================================================================
// App schemas
// ============================================================================

// POST /api/apps
export const CreateAppRequest = Schema.Struct({
  title: Schema.optional(Schema.String),
  initialPrompt: Schema.optional(Schema.String),
});
export type CreateAppRequest = typeof CreateAppRequest.Type;

// GET /api/apps
export const ListAppsParams = Schema.Struct({
  status: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.String),
  offset: Schema.optional(Schema.String),
});
export type ListAppsParams = typeof ListAppsParams.Type;

// PATCH /api/apps/[id]
export const UpdateAppRequest = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  status: Schema.optional(Schema.Literal("active", "archived")),
  slug: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateAppRequest = typeof UpdateAppRequest.Type;

// GET /api/apps/check-slug
export const CheckSlugParams = Schema.Struct({
  slug: Schema.String.pipe(Schema.nonEmptyString()),
  appId: Schema.optional(Schema.String),
});
export type CheckSlugParams = typeof CheckSlugParams.Type;

// DELETE /api/apps/[id]
export const DeleteAppParams = Schema.Struct({
  permanent: Schema.optional(Schema.String),
});
export type DeleteAppParams = typeof DeleteAppParams.Type;

// POST /api/apps/[id]/github/link
export const LinkGitHubRepoRequest = Schema.Struct({
  mode: Schema.Literal("create"),
  repoName: Schema.String.pipe(Schema.nonEmptyString()),
  description: Schema.optional(Schema.String),
});
export type LinkGitHubRepoRequest = typeof LinkGitHubRepoRequest.Type;

// ============================================================================
// Chat schemas
// ============================================================================

// POST /api/chat
export const ChatRequest = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  messages: Schema.Array(Schema.Unknown), // UIMessage validation handled by ai SDK
});
export type ChatRequest = typeof ChatRequest.Type;

// ============================================================================
// Sandbox schemas
// ============================================================================

// POST /api/sandbox/stream
export const StreamRequest = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
});
export type StreamRequest = typeof StreamRequest.Type;

// GET /api/sandbox/logs
export const LogsParams = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
});
export type LogsParams = typeof LogsParams.Type;

// ============================================================================
// Exec schemas
// ============================================================================

// POST /api/exec
export const ExecRequest = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  command: Schema.String.pipe(Schema.nonEmptyString()),
});
export type ExecRequest = typeof ExecRequest.Type;

// GET /api/exec - list sessions
export const SessionIdParam = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
});
export type SessionIdParam = typeof SessionIdParam.Type;

// DELETE /api/exec - kill session
export const DeleteExecParams = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  execSessionId: Schema.String.pipe(Schema.nonEmptyString()),
});
export type DeleteExecParams = typeof DeleteExecParams.Type;

// ============================================================================
// File schemas
// ============================================================================

// GET /api/files
export const FilePathParams = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  path: Schema.optional(Schema.String),
  list: Schema.optional(Schema.String),
});
export type FilePathParams = typeof FilePathParams.Type;

// PUT /api/files
export const WriteFileRequest = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  path: Schema.String.pipe(Schema.nonEmptyString()),
  content: Schema.String,
});
export type WriteFileRequest = typeof WriteFileRequest.Type;

// DELETE /api/files
export const DeleteFileParams = Schema.Struct({
  sessionId: Schema.String.pipe(Schema.nonEmptyString()),
  path: Schema.String.pipe(Schema.nonEmptyString()),
});
export type DeleteFileParams = typeof DeleteFileParams.Type;

// ============================================================================
// Health schemas
// ============================================================================

export const HealthParams = Schema.Struct({
  url: Schema.String.pipe(Schema.nonEmptyString()),
});
export type HealthParams = typeof HealthParams.Type;

// ============================================================================
// Feed schemas
// ============================================================================

// GET /api/feed
export const ListFeedParams = Schema.Struct({
  sort: Schema.optional(Schema.Literal("recent", "popular")),
  limit: Schema.optional(Schema.String),
  offset: Schema.optional(Schema.String),
});
export type ListFeedParams = typeof ListFeedParams.Type;

// POST /api/feed/likes
export const BatchLikesRequest = Schema.Struct({
  appIds: Schema.Array(Schema.String),
});
export type BatchLikesRequest = typeof BatchLikesRequest.Type;

// POST /api/apps/[id]/publish
export const PublishAppRequest = Schema.Struct({
  published: Schema.Boolean,
});
export type PublishAppRequest = typeof PublishAppRequest.Type;

// ============================================================================
// Profile schemas
// ============================================================================

// PATCH /api/users/me
export const UpdateProfileRequest = Schema.Struct({
  username: Schema.optional(Schema.NullOr(Schema.String)),
  bio: Schema.optional(Schema.NullOr(Schema.String)),
});
export type UpdateProfileRequest = typeof UpdateProfileRequest.Type;

// GET /api/users/check-username
export const CheckUsernameParams = Schema.Struct({
  username: Schema.String,
});
export type CheckUsernameParams = typeof CheckUsernameParams.Type;

// ============================================================================
// Inspo schemas
// ============================================================================

// GET /api/inspo
export const ListInsposParams = Schema.Struct({
  category: Schema.optional(Schema.String),
});
export type ListInsposParams = typeof ListInsposParams.Type;

// ============================================================================
// Guided idea schemas
// ============================================================================

// POST /api/ideas
export const GenerateIdeasRequest = Schema.Struct({
  mode: Schema.Literal("suggest"),
  locale: Schema.Literal("en", "ms"),
  category: Schema.String.pipe(Schema.nonEmptyString()),
  categoryLabel: Schema.String.pipe(Schema.nonEmptyString()),
  preference: Schema.String.pipe(Schema.nonEmptyString()),
  preferenceLabel: Schema.String.pipe(Schema.nonEmptyString()),
  refreshCount: Schema.optional(Schema.Number),
});
export type GenerateIdeasRequest = typeof GenerateIdeasRequest.Type;

export const BuildGuidedPromptRequest = Schema.Struct({
  mode: Schema.Literal("prompt"),
  locale: Schema.Literal("en", "ms"),
  category: Schema.String.pipe(Schema.nonEmptyString()),
  categoryLabel: Schema.String.pipe(Schema.nonEmptyString()),
  preference: Schema.String.pipe(Schema.nonEmptyString()),
  preferenceLabel: Schema.String.pipe(Schema.nonEmptyString()),
  ideaTitle: Schema.String.pipe(Schema.nonEmptyString()),
  ideaDescription: Schema.String.pipe(Schema.nonEmptyString()),
  ideaStarter: Schema.String.pipe(Schema.nonEmptyString()),
});
export type BuildGuidedPromptRequest = typeof BuildGuidedPromptRequest.Type;
