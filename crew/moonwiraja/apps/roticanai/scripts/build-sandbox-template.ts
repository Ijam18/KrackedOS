#!/usr/bin/env bun

/**
 * Build the E2B sandbox template for Rotican.ai (v2 build system)
 *
 * Uses the E2B TypeScript SDK Template() builder — no Dockerfile generation,
 * no CLI, no base64 encoding. Just method chaining.
 *
 * The template:
 * - Bun 1.1 on Debian
 * - Copies the entire starter repo from local disk
 * - Runs bun install
 * - setStartCmd: starts dev server, pipes output to /tmp/dev.log
 * - waitForPort(8080): Sandbox.create() blocks until dev server is ready
 *
 * Usage:
 *   bun run sandbox:build-template
 *
 * Requires E2B_API_KEY in environment (SDK reads it automatically).
 * Get your API key at: https://e2b.dev/dashboard
 *
 * The template ID is printed at the end — add it to .env as:
 *   E2B_TEMPLATE_ID=<template-id>
 */

import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { join, relative } from "node:path";
import { Template, waitForPort } from "e2b";

const STARTER_REPO_PATH = "/Users/nizzy/dev/roticanai-nextjs-starter";
const APP_DIR = "/home/user/app";
const TEMPLATE_NAME = "roticanai-sandbox";

async function main() {
  console.log("=".repeat(60));
  console.log("Rotican.ai E2B Template Builder (v2)");
  console.log("=".repeat(60));
  console.log(`\nStarter repo: ${STARTER_REPO_PATH}`);
  console.log(`Template name: ${TEMPLATE_NAME}`);
  console.log(`App dir in sandbox: ${APP_DIR}\n`);

  // E2B locks the build context to this script file's directory (scripts/).
  // The starter repo is outside that, so we copy it into a temp dir here,
  // build from the relative path, then clean up.
  const tmpDir = mkdtempSync(join(import.meta.dir, ".e2b-context-"));
  const tmpStarterDir = join(tmpDir, "starter");

  try {
    console.log("Copying starter files into build context...");
    cpSync(STARTER_REPO_PATH, tmpStarterDir, {
      recursive: true,
      filter: (src) =>
        !src.includes("node_modules") &&
        !src.includes(".next") &&
        !src.includes(".git"),
    });

    const starterRelPath = relative(import.meta.dir, tmpStarterDir);
    console.log(`Starter rel path: ${starterRelPath}\n`);

    const template = Template()
      // E2B's first-party Bun image — pre-configured for the E2B build environment.
      // Default user is `user` with home at /home/user.
      .fromBunImage("1.1")
      // System tools
      .aptInstall(["git", "curl", "wget", "procps"])
      // Copy entire starter repo into the sandbox
      .setWorkdir(APP_DIR)
      .copyItems([{ src: `${starterRelPath}/`, dest: `${APP_DIR}/` }])
      // Install dependencies
      .runCmd("bun install")
      .runCmd("rm -rf /home/user/.bun/install/cache")
      // On sandbox start: run dev server, pipe output to /tmp/dev.log for streaming.
      // waitForPort(8080) makes Sandbox.create() block until the dev server is ready.
      .setStartCmd("bun run dev 2>&1 | tee /tmp/dev.log", waitForPort(8080));

    console.log("Building template (this may take a few minutes)...\n");
    const startTime = Date.now();

    const result = await Template.build(template, TEMPLATE_NAME, {
      cpuCount: 2,
      memoryMB: 4096,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Template built in ${elapsed}s!`);
    console.log("=".repeat(60));
    console.log("\nAdd to your .env:");
    console.log(`\n  E2B_TEMPLATE_ID=${result.templateId ?? result}\n`);
    console.log("=".repeat(60));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});
