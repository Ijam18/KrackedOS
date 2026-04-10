import type { UIMessage } from "ai";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { type Message, message, type NewMessage } from "@/db/schema";

/**
 * Converts a UIMessage to a database row format.
 */
function uiMessageToDb(
  msg: UIMessage,
  appId: string,
  options?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    modelId?: string;
    durationMs?: number;
    finishReason?: string;
  },
): NewMessage {
  return {
    id: msg.id,
    appId,
    role: msg.role,
    parts: msg.parts,
    metadata: msg.metadata ?? null,
    inputTokens: options?.inputTokens ?? null,
    outputTokens: options?.outputTokens ?? null,
    totalTokens: options?.totalTokens ?? null,
    modelId: options?.modelId ?? null,
    durationMs: options?.durationMs ?? null,
    finishReason: options?.finishReason ?? null,
  };
}

/**
 * Converts a database row to UIMessage format.
 */
function dbMessageToUi(row: Message): UIMessage {
  return {
    id: row.id,
    role: row.role as "user" | "assistant" | "system",
    parts: row.parts as UIMessage["parts"],
    metadata: row.metadata as UIMessage["metadata"],
  };
}

/**
 * Save a user message to the database.
 * Uses onConflictDoNothing to prevent duplicate inserts (e.g., from React Strict Mode double-renders).
 */
export async function saveUserMessage(
  appId: string,
  msg: UIMessage,
): Promise<Message | null> {
  const [saved] = await db
    .insert(message)
    .values(uiMessageToDb(msg, appId))
    .onConflictDoNothing({ target: message.id })
    .returning();
  return saved ?? null;
}

/**
 * Save an assistant message with usage statistics.
 * Uses onConflictDoNothing to prevent duplicate inserts.
 */
export async function saveAssistantMessage(
  appId: string,
  msg: UIMessage,
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    modelId?: string;
    durationMs?: number;
    finishReason?: string;
  },
): Promise<Message | null> {
  const [saved] = await db
    .insert(message)
    .values(uiMessageToDb(msg, appId, usage))
    .onConflictDoNothing({ target: message.id })
    .returning();
  return saved ?? null;
}

/**
 * Get all messages for an app, ordered by creation date.
 * Returns UIMessage format ready for the AI SDK.
 */
export async function getMessagesForApp(appId: string): Promise<UIMessage[]> {
  const rows = await db.query.message.findMany({
    where: eq(message.appId, appId),
    orderBy: [asc(message.createdAt)],
  });

  return rows.map(dbMessageToUi);
}

/**
 * Get raw message rows for an app (includes usage stats).
 */
export async function getMessageRowsForApp(appId: string): Promise<Message[]> {
  return db.query.message.findMany({
    where: eq(message.appId, appId),
    orderBy: [asc(message.createdAt)],
  });
}

/**
 * Count messages for an app.
 */
export async function countMessagesForApp(appId: string): Promise<number> {
  const rows = await db.query.message.findMany({
    where: eq(message.appId, appId),
    columns: { id: true },
  });
  return rows.length;
}

/**
 * Delete all messages for an app.
 * Usually not needed since messages cascade delete with app.
 */
export async function deleteMessagesForApp(appId: string): Promise<number> {
  const result = await db
    .delete(message)
    .where(eq(message.appId, appId))
    .returning({ id: message.id });
  return result.length;
}

/**
 * Update a message (e.g., when streaming completes).
 * This can be used to update parts after streaming finishes.
 */
export async function updateMessage(
  messageId: string,
  updates: {
    parts?: UIMessage["parts"];
    metadata?: UIMessage["metadata"];
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    finishReason?: string;
    durationMs?: number;
  },
): Promise<Message | null> {
  // Build update object conditionally
  const updateData: Record<string, unknown> = {};

  if (updates.parts !== undefined) {
    updateData.parts = updates.parts;
  }
  if (updates.metadata !== undefined) {
    updateData.metadata = updates.metadata;
  }
  if (updates.inputTokens !== undefined) {
    updateData.inputTokens = updates.inputTokens;
  }
  if (updates.outputTokens !== undefined) {
    updateData.outputTokens = updates.outputTokens;
  }
  if (updates.totalTokens !== undefined) {
    updateData.totalTokens = updates.totalTokens;
  }
  if (updates.finishReason !== undefined) {
    updateData.finishReason = updates.finishReason;
  }
  if (updates.durationMs !== undefined) {
    updateData.durationMs = updates.durationMs;
  }

  const [updated] = await db
    .update(message)
    .set(updateData)
    .where(eq(message.id, messageId))
    .returning();

  return updated ?? null;
}
