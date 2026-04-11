/**
 * AI tools - SDK tools for sandbox operations
 *
 * Creates tools that the AI can use to interact with the sandbox
 */

import { tool } from "ai";
import { Effect } from "effect";
import { z } from "zod";
import { exec, listFiles, readFile, writeFile } from "@/lib/services/sandbox";

// Tool execution functions - using Effect.runPromise
async function executeReadFile(
  sessionId: string,
  path: string,
): Promise<string> {
  return Effect.runPromise(
    readFile(sessionId, path).pipe(
      Effect.timeout("60 seconds"),
      Effect.catchAll((error) =>
        Effect.succeed(
          "message" in error
            ? `Error reading file: ${error.message}`
            : "Read timed out after 60 seconds",
        ),
      ),
    ),
  );
}

async function executeWriteFile(
  sessionId: string,
  path: string,
  content: string,
): Promise<string> {
  return Effect.runPromise(
    writeFile(sessionId, path, content).pipe(
      Effect.timeout("60 seconds"),
      Effect.map(() => `Successfully wrote to ${path}`),
      Effect.catchAll((error) =>
        Effect.succeed(
          "message" in error
            ? `Error writing file: ${error.message}`
            : "Write timed out after 60 seconds",
        ),
      ),
    ),
  );
}

async function executeListFiles(
  sessionId: string,
  path: string,
): Promise<string[]> {
  return Effect.runPromise(
    listFiles(sessionId, path).pipe(
      Effect.timeout("30 seconds"),
      Effect.map((files) => {
        // Flatten the tree into a list of paths
        const flattenFiles = (
          items: Array<{
            name: string;
            path: string;
            isDir: boolean;
            children?: unknown[];
          }>,
          prefix = "",
        ): string[] => {
          const result: string[] = [];
          for (const item of items) {
            const displayName = item.isDir ? `${item.name}/` : item.name;
            result.push(prefix + displayName);
            if (item.children && Array.isArray(item.children)) {
              result.push(
                ...flattenFiles(
                  item.children as Array<{
                    name: string;
                    path: string;
                    isDir: boolean;
                    children?: unknown[];
                  }>,
                  `${prefix}  `,
                ),
              );
            }
          }
          return result;
        };
        return flattenFiles(files);
      }),
      Effect.catchAll(() => Effect.succeed([] as string[])),
    ),
  );
}

async function executeRunCommand(
  sessionId: string,
  command: string,
): Promise<string> {
  return Effect.runPromise(
    exec(sessionId, command).pipe(
      Effect.timeout("90 seconds"),
      Effect.map((result) => {
        if (result.exitCode !== 0) {
          return `Command failed with exit code ${result.exitCode}\n${result.stderr || result.stdout}`;
        }
        return result.stdout || "Command completed successfully";
      }),
      Effect.catchAll((error) =>
        Effect.succeed(
          "message" in error
            ? `Error executing command: ${error.message}`
            : "Command timed out after 90 seconds",
        ),
      ),
    ),
  );
}

async function executeGetDiagnostics(
  sessionId: string,
  _path?: string,
): Promise<string> {
  return Effect.runPromise(
    exec(sessionId, "bun run lint 2>&1 || true").pipe(
      Effect.timeout("3 minutes"),
      Effect.map((result) => result.stdout || "No lint output"),
      Effect.catchAll((error) =>
        Effect.succeed(
          "message" in error
            ? `Error running lint: ${error.message}`
            : "Lint timed out after 3 minutes",
        ),
      ),
    ),
  );
}

// Schema definitions
const readFileSchema = z.object({
  path: z
    .string()
    .describe(
      "The file path to read, relative to the project root (src/app for pages, src/components for components, etc.)",
    ),
});

const writeFileSchema = z.object({
  path: z
    .string()
    .describe("The file path to write to, relative to the project root"),
  content: z.string().describe("The full content to write to the file"),
});

const listFilesSchema = z.object({
  path: z
    .string()
    .default(".")
    .describe(
      "The directory path to list, relative to the project root. Defaults to root.",
    ),
});

const runCommandSchema = z.object({
  command: z.string().describe("The shell command to execute"),
});

const updateProgressSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().describe("Unique identifier for the item"),
        label: z
          .string()
          .describe(
            "Simple, non-technical description (e.g., 'Creating homepage', 'Adding styles')",
          ),
        status: z
          .enum(["pending", "in_progress", "completed"])
          .describe("Current status of the item"),
      }),
    )
    .describe("The full list of progress items to display"),
});

const askFollowUpSchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().describe("The question to ask the user"),
        header: z
          .string()
          .max(30)
          .describe("Very short label for the question (max 30 chars)"),
        options: z
          .array(
            z.object({
              label: z
                .string()
                .describe(
                  "Short option text (1-5 words). Put recommended option first with '(Recommended)' suffix",
                ),
              description: z
                .string()
                .describe("Brief explanation of this choice"),
            }),
          )
          .describe("Available choices for the user"),
        multiple: z
          .boolean()
          .optional()
          .default(false)
          .describe("Allow selecting multiple choices"),
      }),
    )
    .describe("Questions to ask the user"),
});

/**
 * Factory function to create tools with session-bound execution
 */
export function createSandboxTools(sessionId: string) {
  return {
    readFile: tool({
      description:
        "Read the contents of a file at the specified path. Use this to understand existing code before making changes.",
      inputSchema: readFileSchema,
      execute: async ({ path }) => {
        return executeReadFile(sessionId, path);
      },
    }),

    writeFile: tool({
      description:
        "Write content to a file at the specified path. Creates the file if it doesn't exist, or overwrites if it does. Always read the file first if you need to modify existing content.",
      inputSchema: writeFileSchema,
      execute: async ({ path, content }) => {
        return executeWriteFile(sessionId, path, content);
      },
    }),

    listFiles: tool({
      description:
        "List all files and directories at the specified path. Use this to explore the project structure.",
      inputSchema: listFilesSchema,
      execute: async ({ path }) => {
        const files = await executeListFiles(sessionId, path);
        return JSON.stringify(files, null, 2);
      },
    }),

    runCommand: tool({
      description:
        "Run a shell command in the terminal. Use this for installing packages (bun add), running scripts, or other terminal operations. The command will be executed in the project root.",
      inputSchema: runCommandSchema,
      execute: async ({ command }) => {
        return executeRunCommand(sessionId, command);
      },
    }),

    updateProgress: tool({
      description:
        "Update the progress checklist shown to the user. Call this at the start with your plan, then update as you complete each step. Use simple, non-technical labels that anyone can understand.",
      inputSchema: updateProgressSchema,
      execute: async () => {
        // No-op on server - this tool is purely for UI rendering
        // The tool call itself is captured in the message stream and rendered by the client
        return JSON.stringify({ success: true });
      },
    }),

    lint: tool({
      description:
        "Run the project linter to check code for errors and warnings. Use this after writing files to catch issues before finishing.",
      inputSchema: z.object({
        path: z
          .string()
          .optional()
          .describe("Ignored. Lints the entire project."),
      }),
      execute: async ({ path }) => {
        return executeGetDiagnostics(sessionId, path);
      },
    }),

    askFollowUp: tool({
      description:
        "Ask the user follow-up questions when their request is too vague, is a greeting, or needs clarification before you can build. Use this to gather preferences, clarify ambiguous instructions, or offer choices about direction. Do NOT call updateProgress or write any files when using this tool — just ask. A 'Type your own answer' option is always added automatically by the UI, so don't include 'Other' or catch-all options. If you recommend a specific option, make it the first option and add '(Recommended)' at the end of the label.",
      inputSchema: askFollowUpSchema,
      execute: async () => {
        // No-op on server - rendered by the client as interactive question cards
        return JSON.stringify({ success: true });
      },
    }),
  };
}

// Backwards compatibility alias
export const createSpritesTools = createSandboxTools;
