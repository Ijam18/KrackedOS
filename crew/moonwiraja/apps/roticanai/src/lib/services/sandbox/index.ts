/**
 * Sandbox service - E2B sandbox integration
 *
 * Provides sandbox environment management for running user code.
 *
 * @example
 * ```ts
 * import { createSandbox, getSandbox, exec, readFile, writeFile } from "@/lib/services/sandbox"
 * ```
 */

// Cache (Redis-backed)
export {
  getCachedSandbox,
  removeCachedSandbox,
  setCachedSandbox,
} from "./cache";
// Client utilities (E2B config validation)
export { validateE2BConfig } from "./client";
// Exec (command execution)
export {
  exec,
  execDetached,
  execStreaming,
  killSession,
  listSessions,
} from "./exec";
// Files (file operations)
export {
  deleteFile,
  listFiles,
  pathExists,
  readFile,
  writeFile,
} from "./files";
// Template (E2B template ID)
export { getTemplateId } from "./images";
// Lifecycle (create, get, delete)
export {
  createSandbox,
  deleteSandbox,
  getActiveSandbox,
  getCachedSandboxInfo,
  getSandbox,
  getSandboxStatus,
  restoreFromSnapshot,
} from "./lifecycle";
// Streams (SSE event streams)
export { createLogsStream } from "./logs-stream";
// Services (preview URL, process management)
export {
  debugDevServerStatus,
  getDevServerLogsInfo,
  getDevServerSession,
  getPreviewUrl,
  getTunnels,
  isDevServerReady,
  stopProcess,
} from "./services";
export { createSetupStream } from "./setup-stream";
// Snapshots (filesystem state persistence)
export {
  createCheckpoint,
  createSnapshot,
  restoreCheckpoint,
  restoreSnapshot,
} from "./snapshots";

// Types
export type {
  ExecResult,
  SandboxConfig,
  SandboxFile,
  SandboxInfo,
  SandboxStatus,
  Session,
  Snapshot,
  StreamMessage,
  TunnelInfo,
} from "./types";

export { APP_DIR, DEFAULT_SANDBOX_CONFIG } from "./types";
