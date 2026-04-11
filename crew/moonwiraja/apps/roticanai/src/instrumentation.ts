/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js before the application starts.
 * It initializes OpenTelemetry for server-side tracing and metrics.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only initialize telemetry on the server (Node.js runtime)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTelemetry } = await import("@/lib/telemetry");
    initTelemetry();
  }
}
