/**
 * Home page mode - determines whether to create an app or have an ephemeral chat
 */
export type HomeMode = "build" | "chat";

/**
 * Request body for ephemeral chat API
 */
export interface EphemeralChatRequest {
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    parts?: Array<{
      type: string;
      text?: string;
      [key: string]: unknown;
    }>;
    createdAt?: Date;
  }>;
}
