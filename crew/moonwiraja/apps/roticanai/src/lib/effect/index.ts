// Re-export all effect utilities

export { getSession, requireAuth, requireUser, type Session } from "./auth";
export {
  type ApiError,
  AuthError,
  ConfigError,
  ConflictError,
  InternalError,
  NotFoundError,
  RateLimitError,
  UnauthenticatedError,
  ValidationError,
} from "./errors";
export {
  parseBody,
  parseSearchParams,
  requireEnv,
  requireFound,
  runAuthHandler,
  runHandler,
  tryPromise,
} from "./handler";

export {
  BatchLikesRequest,
  BuildGuidedPromptRequest,
  // Chat schemas
  ChatRequest,
  // App schemas
  CheckSlugParams,
  CheckUsernameParams,
  CreateAppRequest,
  DeleteAppParams,
  DeleteExecParams,
  DeleteFileParams,
  // Exec schemas
  ExecRequest,
  // File schemas
  FilePathParams,
  GenerateIdeasRequest,
  // Health schemas
  HealthParams,
  LinkGitHubRepoRequest,
  ListAppsParams,
  // Feed schemas
  ListFeedParams,
  // Inspo schemas
  ListInsposParams,
  LogsParams,
  PublishAppRequest,
  SessionIdParam,
  // Sandbox schemas
  StreamRequest,
  UpdateAppRequest,
  // Profile schemas
  UpdateProfileRequest,
  WriteFileRequest,
} from "./schemas";

// SSE utilities
export {
  formatSse,
  formatSseEvent,
  rawStreamToSseResponse,
  SSE_HEADERS,
  type SseEvent,
  sseDone,
  sseError,
  sseEvent,
  sseStatus,
  streamToSseResponse,
} from "./sse";
