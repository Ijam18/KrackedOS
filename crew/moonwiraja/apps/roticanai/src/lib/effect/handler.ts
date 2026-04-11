import { Effect, Match, type ParseResult, Schema } from "effect";
import { NextResponse } from "next/server";
import { annotateSpanWithError, logger } from "@/lib/telemetry";
import { requireAuth, type Session } from "./auth";
import {
  type ApiError,
  ConfigError,
  InternalError,
  NotFoundError,
  ValidationError,
} from "./errors";

/**
 * Map an ApiError to a NextResponse with appropriate HTTP status
 */
const errorToResponse = (error: ApiError): NextResponse =>
  Match.value(error).pipe(
    Match.tag("AuthError", () =>
      NextResponse.json({ error: "Authentication failed" }, { status: 401 }),
    ),
    Match.tag("UnauthenticatedError", () =>
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    ),
    Match.tag("ValidationError", (e) =>
      NextResponse.json({ error: e.message, field: e.field }, { status: 400 }),
    ),
    Match.tag("NotFoundError", (e) =>
      NextResponse.json({ error: `${e.resource} not found` }, { status: 404 }),
    ),
    Match.tag("InternalError", (e) =>
      NextResponse.json({ error: e.message }, { status: 500 }),
    ),
    Match.tag("ConfigError", (e) =>
      NextResponse.json(
        { error: `Missing config: ${e.variable}` },
        { status: 500 },
      ),
    ),
    Match.tag("RateLimitError", (e) =>
      NextResponse.json(
        {
          error: e.message,
          code: "DAILY_LIMIT_EXCEEDED",
          remaining: e.remaining,
          resetsAt: e.resetsAt,
        },
        { status: 429 },
      ),
    ),
    Match.tag("ConflictError", (e) =>
      NextResponse.json(
        {
          error: e.message,
          code: e.code,
        },
        { status: 409 },
      ),
    ),
    Match.exhaustive,
  );

/**
 * Run an Effect and convert to NextResponse
 * Handles all ApiError types with appropriate HTTP status codes
 * Automatically traces the request with OpenTelemetry
 */
export const runHandler = <A>(
  effect: Effect.Effect<A, ApiError, never>,
  spanName = "api-handler",
): Promise<NextResponse> =>
  effect.pipe(
    Effect.withSpan(spanName),
    Effect.map((data) => NextResponse.json(data)),
    Effect.tapError((error) =>
      Effect.sync(() => {
        // Log to console
        console.error(`[API Error] ${error._tag}:`, error);
        // Annotate trace span
        annotateSpanWithError(error);
        // Send to Loki
        logger.error(`API Error: ${error._tag}`, error, {
          errorTag: error._tag,
          spanName,
        });
      }),
    ),
    Effect.catchAll((error) => Effect.succeed(errorToResponse(error))),
    Effect.runPromise,
  );

/**
 * Run an Effect that requires authentication
 * Automatically handles auth and maps errors to HTTP responses
 * Automatically traces the request with OpenTelemetry
 */
export const runAuthHandler = <A>(
  handler: (session: Session) => Effect.Effect<A, ApiError, never>,
  spanName = "api-auth-handler",
): Promise<NextResponse> =>
  Effect.gen(function* () {
    const session = yield* requireAuth;
    // Annotate span with user context
    yield* Effect.annotateCurrentSpan({
      "user.id": session.user.id,
    });
    // Log authenticated request
    logger.info(`Authenticated request`, {
      userId: session.user.id,
      spanName,
    });
    return yield* handler(session);
  }).pipe(
    Effect.withSpan(spanName),
    Effect.map((data) => NextResponse.json(data)),
    Effect.tapError((error) =>
      Effect.sync(() => {
        // Log to console
        console.error(`[API Error] ${error._tag}:`, error);
        // Annotate trace span
        annotateSpanWithError(error);
        // Send to Loki
        logger.error(`API Error: ${error._tag}`, error, {
          errorTag: error._tag,
          spanName,
        });
      }),
    ),
    Effect.catchAll((error) => Effect.succeed(errorToResponse(error))),
    Effect.runPromise,
  );

/**
 * Parse request body with Effect Schema validation
 */
export const parseBody = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  req: Request,
): Effect.Effect<A, ValidationError, R> =>
  Effect.tryPromise({
    try: () => req.json(),
    catch: () =>
      new ValidationError({ field: "body", message: "Invalid JSON" }),
  }).pipe(
    Effect.flatMap((json) =>
      Schema.decodeUnknown(schema)(json).pipe(
        Effect.mapError((e) => formatSchemaError(e, "body")),
      ),
    ),
  );

/**
 * Parse URL search params with Effect Schema validation
 */
export const parseSearchParams = <A, I, R>(
  schema: Schema.Schema<A, I, R>,
  req: Request,
): Effect.Effect<A, ValidationError, R> =>
  Effect.sync(() => {
    const url = new URL(req.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }).pipe(
    Effect.flatMap((params) =>
      Schema.decodeUnknown(schema)(params).pipe(
        Effect.mapError((e) => formatSchemaError(e, "query")),
      ),
    ),
  );

/**
 * Format ParseResult.ParseError into ValidationError
 */
const formatSchemaError = (
  error: ParseResult.ParseError,
  location: string,
): ValidationError => {
  // Extract the first issue for a simple error message
  const issue = error.issue;
  let field = location;
  let message = "Validation failed";

  if (issue._tag === "Missing") {
    message = "Required field is missing";
  } else if (issue._tag === "Type") {
    message = `Expected ${issue.ast._tag}, got ${typeof issue.actual}`;
  } else if (issue._tag === "Refinement") {
    message = "Invalid value";
  } else if (issue._tag === "Pointer") {
    field = `${location}.${String(issue.path)}`;
  }

  return new ValidationError({ field, message });
};

/**
 * Require a non-null value or fail with NotFoundError
 */
export const requireFound = <A>(
  value: A | null | undefined,
  resource: string,
  id?: string,
): Effect.Effect<A, NotFoundError> =>
  value != null
    ? Effect.succeed(value)
    : Effect.fail(new NotFoundError({ resource, id }));

/**
 * Wrap a Promise-based function with Effect and map errors to InternalError
 */
export const tryPromise = <A>(options: {
  try: () => Promise<A>;
  message: string;
}): Effect.Effect<A, InternalError> =>
  Effect.tryPromise({
    try: options.try,
    catch: (cause) =>
      new InternalError({
        message: options.message,
        cause,
      }),
  });

/**
 * Get required environment variable or fail with ConfigError
 */
export const requireEnv = (
  variable: string,
): Effect.Effect<string, ConfigError> => {
  const value = process.env[variable];
  return value
    ? Effect.succeed(value)
    : Effect.fail(new ConfigError({ variable }));
};
