/**
 * Server-Sent Events (SSE) utilities for Effect streams
 */

import { Stream } from "effect";

/**
 * SSE event type for type-safe event emission
 */
export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Format an SSE event as a string
 */
export const formatSseEvent = (event: string, data: unknown): string =>
  `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * Format an SseEvent object as a string
 */
export const formatSse = (sse: SseEvent): string =>
  formatSseEvent(sse.event, sse.data);

/**
 * Create an SSE event object
 */
export const sseEvent = (event: string, data: unknown): SseEvent => ({
  event,
  data,
});

/**
 * Standard SSE response headers
 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

/**
 * Convert an Effect Stream of SSE events to a Response
 */
export const streamToSseResponse = <E>(
  stream: Stream.Stream<SseEvent, E, never>,
): Response => {
  const textStream = stream.pipe(
    Stream.map(formatSse),
    Stream.map((s) => new TextEncoder().encode(s)),
  );

  return new Response(Stream.toReadableStream(textStream), {
    headers: SSE_HEADERS,
  });
};

/**
 * Convert an Effect Stream of raw strings to a Response
 * (for pre-formatted SSE strings)
 */
export const rawStreamToSseResponse = <E>(
  stream: Stream.Stream<string, E, never>,
): Response => {
  const encodedStream = stream.pipe(
    Stream.map((s) => new TextEncoder().encode(s)),
  );

  return new Response(Stream.toReadableStream(encodedStream), {
    headers: SSE_HEADERS,
  });
};

/**
 * Create an error SSE event
 */
export const sseError = (message: string): SseEvent =>
  sseEvent("error", { message });

/**
 * Create a status SSE event
 */
export const sseStatus = (
  step: string,
  message: string,
  extra?: Record<string, unknown>,
): SseEvent => sseEvent("status", { step, message, ...extra });

/**
 * Create a done SSE event
 */
export const sseDone = (data?: unknown): SseEvent =>
  sseEvent("done", data ?? {});
