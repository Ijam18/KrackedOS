import { NodeSdk, type Resource } from "@effect/opentelemetry";
import { metrics } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { Effect, type Layer } from "effect";

// Environment configuration
// Tempo endpoint for traces (OTLP HTTP)
const TEMPO_ENDPOINT =
  process.env.OTEL_EXPORTER_OTLP_ENDPOINT ||
  "http://tempo.railway.internal:4318";

// Loki endpoint for logs (OTLP HTTP)
const LOKI_ENDPOINT =
  process.env.LOKI_ENDPOINT || "http://loki.railway.internal:3100";

// Prometheus endpoint for metrics (via Prometheus remote write or OTLP)
// When using Prometheus with OTLP receiver, metrics go to the same endpoint as traces
const PROMETHEUS_ENDPOINT = process.env.PROMETHEUS_ENDPOINT || TEMPO_ENDPOINT;

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME || "roticanai";
const SERVICE_VERSION = process.env.npm_package_version || "0.0.1";
const ENVIRONMENT = process.env.NODE_ENV || "development";
const OTEL_ENABLED = process.env.OTEL_ENABLED !== "false";

/**
 * Create trace exporter (sends to Tempo via OTLP HTTP)
 */
const traceExporter = new OTLPTraceExporter({
  url: `${TEMPO_ENDPOINT}/v1/traces`,
});

/**
 * Create log exporter (sends to Loki via OTLP HTTP)
 */
const logExporter = new OTLPLogExporter({
  url: `${LOKI_ENDPOINT}/otlp/v1/logs`,
});

/**
 * Create metrics exporter (sends to Prometheus via OTLP HTTP)
 */
const metricsExporter = new OTLPMetricExporter({
  url: `${PROMETHEUS_ENDPOINT}/v1/metrics`,
});

/**
 * Initialize the OpenTelemetry SDK for Node.js
 * This provides auto-instrumentation for HTTP, fetch, etc.
 */
let sdk: NodeSDK | null = null;
let loggerProvider: LoggerProvider | null = null;
let meterProvider: MeterProvider | null = null;

export function initTelemetry(): void {
  if (!OTEL_ENABLED) {
    console.log("[Telemetry] Disabled via OTEL_ENABLED=false");
    return;
  }

  if (sdk) {
    console.log("[Telemetry] Already initialized");
    return;
  }

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: SERVICE_NAME,
    [ATTR_SERVICE_VERSION]: SERVICE_VERSION,
    "deployment.environment": ENVIRONMENT,
  });

  // Initialize Logger Provider for Loki
  loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(logExporter)],
  });
  logs.setGlobalLoggerProvider(loggerProvider);

  // Initialize Meter Provider for Prometheus
  meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricsExporter,
        exportIntervalMillis: 30000, // Export every 30 seconds
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);

  // Create default meters for the app
  initializeMeters();

  sdk = new NodeSDK({
    resource,
    traceExporter,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable some noisy instrumentations
        "@opentelemetry/instrumentation-fs": { enabled: false },
        "@opentelemetry/instrumentation-dns": { enabled: false },
      }),
    ],
  });

  sdk.start();

  console.log(`[Telemetry] Initialized`);
  console.log(`[Telemetry] Traces → ${TEMPO_ENDPOINT}`);
  console.log(`[Telemetry] Logs → ${LOKI_ENDPOINT}`);
  console.log(`[Telemetry] Metrics → ${PROMETHEUS_ENDPOINT}`);
  console.log(`[Telemetry] Service: ${SERVICE_NAME}@${SERVICE_VERSION}`);

  // Send startup log to Loki
  setTimeout(() => {
    logger.info("Telemetry initialized", {
      tempoEndpoint: TEMPO_ENDPOINT,
      lokiEndpoint: LOKI_ENDPOINT,
      environment: ENVIRONMENT,
    });
  }, 1000);

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    try {
      await Promise.all([
        sdk?.shutdown(),
        loggerProvider?.shutdown(),
        meterProvider?.shutdown(),
      ]);
      console.log("[Telemetry] Shut down successfully");
    } catch (err) {
      console.error("[Telemetry] Shutdown error", err);
    } finally {
      process.exit(0);
    }
  });
}

/**
 * Get the OpenTelemetry logger for sending logs to Loki
 */
export function getLogger(name = "app") {
  const provider = logs.getLoggerProvider();
  return provider.getLogger(name, SERVICE_VERSION);
}

/**
 * Get the OpenTelemetry meter for recording metrics
 */
export function getMeter(name = "app") {
  return metrics.getMeter(name, SERVICE_VERSION);
}

// ============================================================================
// METRICS
// ============================================================================

// Pre-created meters and instruments for common metrics
let aiGenerationCounter: ReturnType<
  ReturnType<typeof getMeter>["createCounter"]
>;
let aiTokensCounter: ReturnType<ReturnType<typeof getMeter>["createCounter"]>;
let aiDurationHistogram: ReturnType<
  ReturnType<typeof getMeter>["createHistogram"]
>;
let sandboxCounter: ReturnType<ReturnType<typeof getMeter>["createCounter"]>;
let appCounter: ReturnType<ReturnType<typeof getMeter>["createCounter"]>;
let errorCounter: ReturnType<ReturnType<typeof getMeter>["createCounter"]>;
let rateLimitCounter: ReturnType<ReturnType<typeof getMeter>["createCounter"]>;
let activeUsersGauge: ReturnType<
  ReturnType<typeof getMeter>["createUpDownCounter"]
>;

/**
 * Initialize all metric instruments
 */
function initializeMeters() {
  const meter = getMeter();

  // AI Generation metrics
  aiGenerationCounter = meter.createCounter("ai.generation.count", {
    description: "Number of AI generations",
  });

  aiTokensCounter = meter.createCounter("ai.tokens.total", {
    description: "Total tokens used in AI generations",
  });

  aiDurationHistogram = meter.createHistogram("ai.generation.duration", {
    description: "AI generation duration in milliseconds",
    unit: "ms",
  });

  // Sandbox metrics
  sandboxCounter = meter.createCounter("sandbox.operations.count", {
    description: "Number of sandbox operations",
  });

  // App metrics
  appCounter = meter.createCounter("app.operations.count", {
    description: "Number of app operations (create, archive, delete)",
  });

  // Error metrics
  errorCounter = meter.createCounter("errors.count", {
    description: "Number of errors",
  });

  // Rate limiting metrics
  rateLimitCounter = meter.createCounter("rate_limit.count", {
    description: "Number of rate limit events",
  });

  // Active users gauge (can go up and down)
  activeUsersGauge = meter.createUpDownCounter("users.active", {
    description: "Number of currently active users",
  });
}

/**
 * Metric helper functions for recording application metrics
 */
export const appMetrics = {
  /**
   * Record an AI generation
   */
  recordAiGeneration: (attributes: {
    model: string;
    success: boolean;
    userId?: string;
    appId?: string;
  }) => {
    if (!OTEL_ENABLED) return;
    aiGenerationCounter?.add(1, {
      model: attributes.model,
      success: String(attributes.success),
      ...(attributes.userId && { userId: attributes.userId }),
      ...(attributes.appId && { appId: attributes.appId }),
    });
  },

  /**
   * Record token usage
   */
  recordTokens: (attributes: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  }) => {
    if (!OTEL_ENABLED) return;
    aiTokensCounter?.add(attributes.totalTokens, {
      model: attributes.model,
      type: "total",
    });
    aiTokensCounter?.add(attributes.promptTokens, {
      model: attributes.model,
      type: "prompt",
    });
    aiTokensCounter?.add(attributes.completionTokens, {
      model: attributes.model,
      type: "completion",
    });
  },

  /**
   * Record AI generation duration
   */
  recordAiDuration: (
    durationMs: number,
    attributes: { model: string; success: boolean },
  ) => {
    if (!OTEL_ENABLED) return;
    aiDurationHistogram?.record(durationMs, {
      model: attributes.model,
      success: String(attributes.success),
    });
  },

  /**
   * Record sandbox operation
   */
  recordSandboxOp: (
    operation:
      | "create"
      | "reconnect"
      | "reconnect_failed"
      | "restore"
      | "restore_failed"
      | "terminate"
      | "error",
  ) => {
    if (!OTEL_ENABLED) return;
    sandboxCounter?.add(1, { operation });
  },

  /**
   * Record app operation
   */
  recordAppOp: (operation: "create" | "archive" | "delete" | "restore") => {
    if (!OTEL_ENABLED) return;
    appCounter?.add(1, { operation });
  },

  /**
   * Record an error
   */
  recordError: (errorType: string, attributes?: Record<string, string>) => {
    if (!OTEL_ENABLED) return;
    errorCounter?.add(1, { type: errorType, ...attributes });
  },

  /**
   * Record rate limit event
   */
  recordRateLimit: (limitType: string, userId?: string) => {
    if (!OTEL_ENABLED) return;
    rateLimitCounter?.add(1, {
      type: limitType,
      ...(userId && { userId }),
    });
  },

  /**
   * Update active users count
   */
  updateActiveUsers: (delta: 1 | -1) => {
    if (!OTEL_ENABLED) return;
    activeUsersGauge?.add(delta);
  },
};

/**
 * Log helper functions that send to Loki via OpenTelemetry
 */
export const logger = {
  info: (message: string, attributes?: Record<string, unknown>) => {
    if (!OTEL_ENABLED) return;
    const otelLogger = getLogger();
    otelLogger.emit({
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body: message,
      attributes: attributes as Record<string, string | number | boolean>,
    });
  },

  warn: (message: string, attributes?: Record<string, unknown>) => {
    if (!OTEL_ENABLED) return;
    const otelLogger = getLogger();
    otelLogger.emit({
      severityNumber: SeverityNumber.WARN,
      severityText: "WARN",
      body: message,
      attributes: attributes as Record<string, string | number | boolean>,
    });
  },

  error: (
    message: string,
    error?: unknown,
    attributes?: Record<string, unknown>,
  ) => {
    if (!OTEL_ENABLED) return;
    const otelLogger = getLogger();
    otelLogger.emit({
      severityNumber: SeverityNumber.ERROR,
      severityText: "ERROR",
      body: message,
      attributes: {
        ...attributes,
        "error.type": error instanceof Error ? error.name : "Unknown",
        "error.message": error instanceof Error ? error.message : String(error),
        "error.stack": error instanceof Error ? error.stack : undefined,
      } as Record<string, string | number | boolean | undefined>,
    });
  },

  debug: (message: string, attributes?: Record<string, unknown>) => {
    if (!OTEL_ENABLED) return;
    const otelLogger = getLogger();
    otelLogger.emit({
      severityNumber: SeverityNumber.DEBUG,
      severityText: "DEBUG",
      body: message,
      attributes: attributes as Record<string, string | number | boolean>,
    });
  },
};

/**
 * Effect Layer for OpenTelemetry integration
 * Provides tracing context to Effect programs
 */
export const TelemetryLive: Layer.Layer<Resource.Resource> = NodeSdk.layer(
  () => ({
    resource: {
      serviceName: SERVICE_NAME,
      serviceVersion: SERVICE_VERSION,
      attributes: {
        "deployment.environment": ENVIRONMENT,
      },
    },
    spanProcessor: new BatchSpanProcessor(traceExporter),
  }),
);

/**
 * Helper to create a traced Effect with automatic span creation
 */
export const withTrace = <A, E, R>(
  name: string,
  effect: Effect.Effect<A, E, R>,
  attributes?: Record<string, string | number | boolean>,
): Effect.Effect<A, E, R> => effect.pipe(Effect.withSpan(name, { attributes }));

/**
 * Annotate the current span with error details
 * Call this within an Effect.tapError to add error context to traces
 */
export const annotateSpanWithError = (
  error: unknown,
): Effect.Effect<void, never, never> =>
  Effect.annotateCurrentSpan({
    "error.occurred": true,
    "error.type":
      error instanceof Error
        ? error.name
        : typeof error === "object" && error !== null && "_tag" in error
          ? String((error as { _tag: unknown })._tag)
          : "Unknown",
    "error.message":
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: unknown }).message)
          : String(error),
  });

/**
 * Export telemetry state for testing/debugging
 */
export const getTelemetryState = () => ({
  enabled: OTEL_ENABLED,
  tempoEndpoint: TEMPO_ENDPOINT,
  lokiEndpoint: LOKI_ENDPOINT,
  prometheusEndpoint: PROMETHEUS_ENDPOINT,
  serviceName: SERVICE_NAME,
  serviceVersion: SERVICE_VERSION,
  environment: ENVIRONMENT,
});
