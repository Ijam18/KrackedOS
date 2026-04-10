#!/usr/bin/env bun
/**
 * Test E2B sandbox creation and preview URL.
 *
 * Creates a sandbox from the configured template, waits for the dev server
 * to be ready (handled by setStartCmd + waitForURL in the template), then
 * prints the preview URL.
 *
 * Usage:
 *   bun run scripts/test-sandbox.ts
 */

import { Sandbox } from "e2b";

const APP_DIR = "/home/user/app";

async function main() {
  console.log("=".repeat(60));
  console.log("E2B Sandbox Test");
  console.log("=".repeat(60));

  if (!process.env.E2B_API_KEY) {
    console.error("Error: E2B_API_KEY must be set in environment");
    process.exit(1);
  }

  const templateId = process.env.E2B_TEMPLATE_ID;
  if (!templateId) {
    console.error("Error: E2B_TEMPLATE_ID must be set in environment");
    process.exit(1);
  }

  console.log(`\nUsing template: ${templateId}`);
  console.log(
    "\nCreating sandbox (blocks until dev server is ready via waitForURL)...",
  );

  const startTime = Date.now();
  const sandbox = await Sandbox.create(templateId, {
    timeoutMs: 10 * 60 * 1000, // 10 minutes
    metadata: { test: "true" },
  });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const previewUrl = `https://${sandbox.getHost(8080)}`;

  console.log(`\nSandbox created in ${elapsed}s!`);
  console.log(`Sandbox ID: ${sandbox.sandboxId}`);
  console.log(`Preview URL: ${previewUrl}`);

  // Quick sanity check
  console.log("\nVerifying files in sandbox...");
  const result = await sandbox.commands.run(`ls ${APP_DIR}/src/app/`);
  console.log(`${APP_DIR}/src/app/ contents:\n${result.stdout}`);

  console.log(`\n${"=".repeat(60)}`);
  console.log("SANDBOX READY");
  console.log("=".repeat(60));
  console.log(`\nPreview URL: ${previewUrl}`);
  console.log("\nPress Ctrl+C to terminate the sandbox");
  console.log("=".repeat(60));

  // Handle Ctrl+C
  process.on("SIGINT", async () => {
    console.log("\n\nTerminating sandbox...");
    try {
      await sandbox.kill();
      console.log("Sandbox terminated.");
    } catch (e) {
      console.error("Failed to terminate:", e);
    }
    process.exit(0);
  });

  // Keep the process running
  await new Promise(() => {});
}

main().catch((error) => {
  console.error("Test failed:", error);
  process.exit(1);
});
