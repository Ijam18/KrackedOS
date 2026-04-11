/**
 * Sandbox types
 *
 * Type definitions for sandbox operations (E2B Sandboxes)
 */

export type SandboxStatus = "running" | "terminated" | "unknown";

export interface SandboxInfo {
  id: string; // sessionId (app ID)
  sandboxId: string; // E2B sandbox ID
  status: SandboxStatus;
  previewUrl: string; // E2B tunnel URL
  createdAt: string;
}

export interface SandboxFile {
  name: string;
  path: string;
  isDir: boolean;
  children?: SandboxFile[];
}

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface StreamMessage {
  type: "info" | "error" | "complete";
  data?: string;
  error?: string;
  time?: string;
}

export interface Snapshot {
  id: string; // E2B snapshot ID
  createdAt: string;
}

export interface Session {
  id: string;
  command: string;
  created: string;
  isActive: boolean;
}

export interface TunnelInfo {
  port: number;
  url: string;
}

/**
 * Configuration for sandbox creation
 */
export interface SandboxConfig {
  /**
   * Max wall-clock lifetime from creation (passed to Sandbox.create).
   * Sandbox is terminated after this regardless of activity.
   * E2B limits: 1h on Base tier, 24h on Pro tier.
   */
  timeoutMs?: number;
  /**
   * Inactivity timeout (passed to Sandbox.connect).
   * Resets on every reconnect — this is how idle timeout works in E2B.
   * If no reconnect happens within this window, the sandbox terminates.
   */
  idleTimeoutMs?: number;
  /** Working directory inside the sandbox */
  workdir?: string;
}

/**
 * Default sandbox configuration
 */
export const DEFAULT_SANDBOX_CONFIG: Required<SandboxConfig> = {
  timeoutMs: 60 * 60 * 1000, // 1 hour max lifetime (Base tier limit)
  idleTimeoutMs: 30 * 60 * 1000, // 30 min idle — resets on each reconnect
  workdir: "/home/user/app",
};

/**
 * App directory path inside the sandbox.
 * E2B's default user is `user` with home at /home/user.
 */
export const APP_DIR = "/home/user/app";
