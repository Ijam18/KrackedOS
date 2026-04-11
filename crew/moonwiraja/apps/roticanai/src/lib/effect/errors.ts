import { Schema } from "effect";

// Auth errors (401) - authentication failures
export class AuthError extends Schema.TaggedError<AuthError>()("AuthError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}

// Unauthenticated errors (401) - no valid session
export class UnauthenticatedError extends Schema.TaggedError<UnauthenticatedError>()(
  "UnauthenticatedError",
  {},
) {}

// Validation errors (400) - invalid input, missing fields, bad format
export class ValidationError extends Schema.TaggedError<ValidationError>()(
  "ValidationError",
  {
    field: Schema.String,
    message: Schema.String,
  },
) {}

// Not found errors (404) - resource doesn't exist
export class NotFoundError extends Schema.TaggedError<NotFoundError>()(
  "NotFoundError",
  {
    resource: Schema.String,
    id: Schema.optional(Schema.String),
  },
) {}

// Internal errors (500) - unexpected failures, external service errors
export class InternalError extends Schema.TaggedError<InternalError>()(
  "InternalError",
  {
    message: Schema.String,
    cause: Schema.optional(Schema.Unknown),
  },
) {}

// Config errors (500) - missing environment variables
export class ConfigError extends Schema.TaggedError<ConfigError>()(
  "ConfigError",
  {
    variable: Schema.String,
  },
) {}

// Rate limit errors (429) - quota exceeded
export class RateLimitError extends Schema.TaggedError<RateLimitError>()(
  "RateLimitError",
  {
    message: Schema.String,
    remaining: Schema.Number,
    resetsAt: Schema.String, // ISO string
  },
) {}

// Conflict errors (409) - valid request but current state blocks it
export class ConflictError extends Schema.TaggedError<ConflictError>()(
  "ConflictError",
  {
    message: Schema.String,
    code: Schema.optional(Schema.String),
  },
) {}

// Union type for all API errors
export type ApiError =
  | AuthError
  | UnauthenticatedError
  | ValidationError
  | NotFoundError
  | InternalError
  | ConfigError
  | RateLimitError
  | ConflictError;
