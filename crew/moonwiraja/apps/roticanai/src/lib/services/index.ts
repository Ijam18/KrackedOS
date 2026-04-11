/**
 * Services - Business logic layer
 *
 * @example
 * ```ts
 * // App/Message CRUD
 * import { createApp, getApp, saveUserMessage } from "@/lib/services"
 *
 * // AI services
 * import { systemPrompt, createSandboxTools, generateTitle } from "@/lib/services/ai"
 *
 * // Sandbox operations
 * import { createSandbox, exec, readFile, writeFile } from "@/lib/services/sandbox"
 *
 * // Screenshot capture
 * import { scheduleScreenshotCapture } from "@/lib/services/screenshot"
 * ```
 */

// App CRUD
export {
  archiveApp,
  checkSlugAvailability,
  checkSlugAvailabilityEffect,
  clearAppGitHubLink,
  createApp,
  deleteApp,
  getApp,
  getAppGitHubLink,
  getAppsForUser,
  markAppGitHubPushed,
  setAppGitHubLink,
  setAppSandboxId,
  updateApp,
  updateAppSlug,
  updateAppThumbnail,
  updateAppUsage,
  validateSlugFormat,
  verifyAppOwnership,
} from "./app";

// Message CRUD
export {
  countMessagesForApp,
  deleteMessagesForApp,
  getMessageRowsForApp,
  getMessagesForApp,
  saveAssistantMessage,
  saveUserMessage,
  updateMessage,
} from "./message";

// Usage tracking
export {
  checkDailyLimit,
  checkDailyLimitForActor,
  getDailyUsage,
  getDailyUsageForActor,
  getKLDate,
  getUsageActor,
  incrementDailyUsage,
  incrementDailyUsageForActor,
} from "./usage";
