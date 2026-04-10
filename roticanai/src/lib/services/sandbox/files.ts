/**
 * Sandbox files - File operations using E2B's filesystem API
 *
 * Read and write use E2B's native sandbox.files API.
 * Delete, list, and pathExists use exec since E2B has no native equivalent.
 */

import { Effect } from "effect";
import {
  type ConfigError,
  InternalError,
  type NotFoundError,
} from "@/lib/effect/errors";
import { getActiveSandbox } from "./lifecycle";
import type { SandboxFile } from "./types";
import { APP_DIR } from "./types";

/**
 * Normalize a path to be absolute within the sandbox
 */
const normalizePath = (path: string): string => {
  if (path.startsWith("/")) return path;
  return `${APP_DIR}/${path}`;
};

/**
 * Read file contents using E2B's filesystem API
 */
export const readFile = (
  sessionId: string,
  path: string,
): Effect.Effect<string, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);
    const fullPath = normalizePath(path);

    const content = yield* Effect.tryPromise({
      try: () => sandbox.files.read(fullPath),
      catch: (error) =>
        new InternalError({
          message: `Failed to read file: ${fullPath} - ${error}`,
          cause: error,
        }),
    });

    return content;
  });

/**
 * Write content to a file using E2B's filesystem API.
 * E2B automatically creates parent directories.
 */
export const writeFile = (
  sessionId: string,
  path: string,
  content: string,
): Effect.Effect<void, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);
    const fullPath = normalizePath(path);

    yield* Effect.tryPromise({
      try: () => sandbox.files.write(fullPath, content),
      catch: (error) =>
        new InternalError({
          message: `Failed to write file: ${fullPath} - ${error}`,
          cause: error,
        }),
    });
  });

/**
 * Delete a file or directory
 */
export const deleteFile = (
  sessionId: string,
  path: string,
): Effect.Effect<void, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);
    const fullPath = normalizePath(path);

    yield* Effect.tryPromise({
      try: () => sandbox.commands.run(`rm -rf "${fullPath}"`),
      catch: (error) =>
        new InternalError({
          message: `Failed to delete file: ${fullPath} - ${error}`,
          cause: error,
        }),
    }).pipe(
      Effect.timeout("30 seconds"),
      Effect.mapError(
        (e) =>
          new InternalError({
            message: `Delete timed out or failed: ${e}`,
            cause: e,
          }),
      ),
    );
  });

/**
 * List files in a directory recursively, building a tree structure
 */
export const listFiles = (
  sessionId: string,
  path = ".",
): Effect.Effect<SandboxFile[], NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);

    const basePath = normalizePath(path === "." ? "" : path);
    const searchBase = basePath || APP_DIR;

    const result = yield* Effect.tryPromise({
      try: () =>
        sandbox.commands.run(
          `find "${searchBase}" -maxdepth 10 \\( -name node_modules -o -name .next -o -name .git \\) -prune -o -print`,
        ),
      catch: (error) =>
        new InternalError({
          message: `Failed to list files: ${error}`,
          cause: error,
        }),
    });

    const lines = result.stdout.trim().split("\n").filter(Boolean);

    // Build tree structure
    const fileMap = new Map<string, SandboxFile>();
    const rootFiles: SandboxFile[] = [];

    // First pass: create all nodes
    for (const line of lines) {
      const fullPath = line.trim();
      if (!fullPath || fullPath === searchBase) continue;

      const relativePath = fullPath.startsWith(`${searchBase}/`)
        ? fullPath.substring(searchBase.length + 1)
        : fullPath.substring(searchBase.length);

      if (!relativePath) continue;

      const parts = relativePath.split("/");
      const name = parts[parts.length - 1];

      const isDir = lines.some(
        (l: string) => l.startsWith(`${fullPath}/`) && l !== fullPath,
      );

      const file: SandboxFile = {
        name,
        path: relativePath,
        isDir,
        children: isDir ? [] : undefined,
      };

      fileMap.set(relativePath, file);
    }

    // Second pass: build tree structure
    for (const [filePath, file] of fileMap) {
      const parts = filePath.split("/");
      if (parts.length === 1) {
        rootFiles.push(file);
      } else {
        const parentPath = parts.slice(0, -1).join("/");
        const parent = fileMap.get(parentPath);
        if (parent?.children) {
          parent.children.push(file);
        }
      }
    }

    const sortFiles = (files: SandboxFile[]): SandboxFile[] =>
      files.sort((a, b) => {
        if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    const sortRecursively = (files: SandboxFile[]): SandboxFile[] => {
      const sorted = sortFiles(files);
      for (const file of sorted) {
        if (file.children) {
          file.children = sortRecursively(file.children);
        }
      }
      return sorted;
    };

    return sortRecursively(rootFiles);
  });

/**
 * Check if a path exists
 */
export const pathExists = (
  sessionId: string,
  path: string,
): Effect.Effect<boolean, NotFoundError | ConfigError | InternalError> =>
  Effect.gen(function* () {
    const sandbox = yield* getActiveSandbox(sessionId);
    const fullPath = normalizePath(path);

    const result = yield* Effect.tryPromise({
      try: () =>
        sandbox.commands.run(`test -e "${fullPath}" && echo 1 || echo 0`),
      catch: () => ({ stdout: "0", stderr: "", exitCode: 1 }),
    }).pipe(
      Effect.catchAll(() =>
        Effect.succeed({ stdout: "0", stderr: "", exitCode: 1 }),
      ),
    );

    return result.stdout.trim() === "1";
  });
