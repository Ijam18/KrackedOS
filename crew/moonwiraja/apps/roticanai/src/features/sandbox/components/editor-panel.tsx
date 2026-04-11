"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { CodeEditor } from "@/components/code-editor";
import {
  fetchFileContent,
  runWithHttp,
  sandboxKeys,
  useFileContentQuery,
  useSaveFileMutation,
} from "@/features/sandbox/hooks/queries";
import { cn } from "@/lib/ui/utils";

interface EditorPanelProps {
  sessionId: string;
  openFiles: string[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onFileClose: (path: string) => void;
  onSave?: () => void;
}

// Get file icon based on extension
function getFileIcon(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const iconMap: Record<string, string> = {
    js: "JS",
    jsx: "JSX",
    ts: "TS",
    tsx: "TSX",
    css: "CSS",
    html: "HTML",
    json: "{}",
    md: "MD",
    py: "PY",
  };
  return iconMap[ext] || "FILE";
}

// Get just the filename from path
function getFileName(path: string): string {
  return path.split("/").pop() || path;
}

export function EditorPanel({
  sessionId,
  openFiles,
  activeFile,
  onFileSelect,
  onFileClose,
  onSave,
}: EditorPanelProps) {
  const queryClient = useQueryClient();

  // Track local edits (unsaved changes) per file
  const [localEdits, setLocalEdits] = useState<Record<string, string>>({});

  // Query for the active file's content
  const {
    data: activeFileContent,
    isLoading: isLoadingActiveFile,
    error: activeFileError,
  } = useFileContentQuery(sessionId, activeFile, !!activeFile);

  // Save mutation
  const saveMutation = useSaveFileMutation(sessionId);

  // Prefetch open files that aren't the active file
  useEffect(() => {
    for (const file of openFiles) {
      if (file !== activeFile) {
        queryClient.prefetchQuery({
          queryKey: sandboxKeys.fileContent(sessionId, file),
          queryFn: () => runWithHttp(fetchFileContent(sessionId, file)),
        });
      }
    }
  }, [openFiles, activeFile, sessionId, queryClient]);

  // Get the current content for a file (local edit or cached query data)
  const getFileContent = useCallback(
    (filePath: string): string | undefined => {
      if (localEdits[filePath] !== undefined) {
        return localEdits[filePath];
      }
      const cached = queryClient.getQueryData<string>(
        sandboxKeys.fileContent(sessionId, filePath),
      );
      return cached;
    },
    [localEdits, queryClient, sessionId],
  );

  // Get the original (server) content for a file
  const getOriginalContent = useCallback(
    (filePath: string): string | undefined => {
      return queryClient.getQueryData<string>(
        sandboxKeys.fileContent(sessionId, filePath),
      );
    },
    [queryClient, sessionId],
  );

  // Check if file has unsaved changes
  const hasChanges = useCallback(
    (filePath: string) => {
      const local = localEdits[filePath];
      if (local === undefined) return false;
      const original = getOriginalContent(filePath);
      return local !== original;
    },
    [localEdits, getOriginalContent],
  );

  // Check if a file is currently loading
  const isFileLoading = useCallback(
    (filePath: string): boolean => {
      if (filePath === activeFile) {
        return isLoadingActiveFile;
      }
      const state = queryClient.getQueryState(
        sandboxKeys.fileContent(sessionId, filePath),
      );
      return state?.status === "pending";
    },
    [activeFile, isLoadingActiveFile, queryClient, sessionId],
  );

  // Get error for a file
  const getFileError = useCallback(
    (filePath: string): string | null => {
      if (filePath === activeFile && activeFileError) {
        return activeFileError.message;
      }
      const state = queryClient.getQueryState(
        sandboxKeys.fileContent(sessionId, filePath),
      );
      if (state?.status === "error" && state.error) {
        return (state.error as Error).message;
      }
      return null;
    },
    [activeFile, activeFileError, queryClient, sessionId],
  );

  // Save file
  const handleSave = useCallback(async () => {
    if (!activeFile || !hasChanges(activeFile)) return;

    const content = localEdits[activeFile];
    if (content === undefined) return;

    try {
      await saveMutation.mutateAsync({ path: activeFile, content });
      // Clear local edit after successful save
      setLocalEdits((prev) => {
        const newEdits = { ...prev };
        delete newEdits[activeFile];
        return newEdits;
      });
      onSave?.();
    } catch {
      // Error is handled by the mutation
    }
  }, [activeFile, hasChanges, localEdits, saveMutation, onSave]);

  // Keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  // Update content when editing
  const handleEditorChange = (value: string | undefined) => {
    if (activeFile && value !== undefined) {
      setLocalEdits((prev) => ({ ...prev, [activeFile]: value }));
    }
  };

  // Get the display content for the active file
  const displayContent =
    activeFile !== null
      ? (getFileContent(activeFile) ?? activeFileContent ?? "")
      : "";

  if (openFiles.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#1e1e1e] text-muted-foreground">
        <p className="text-sm">Select a file to edit</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e]">
      {/* Tab bar */}
      <div
        className="flex border-b border-[#3c3c3c] bg-[#252526]"
        role="tablist"
      >
        {openFiles.map((filePath) => (
          <div
            key={filePath}
            role="tab"
            tabIndex={0}
            aria-selected={activeFile === filePath}
            className={cn(
              "group flex cursor-pointer items-center gap-1 px-3 py-1.5 text-sm",
              activeFile === filePath
                ? "bg-[#1e1e1e] text-foreground"
                : "bg-[#2d2d2d] text-muted-foreground hover:bg-[#2a2a2a]",
            )}
            onClick={() => onFileSelect(filePath)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFileSelect(filePath);
              }
            }}
          >
            <span className="text-xs font-mono text-muted-foreground">
              {getFileIcon(filePath)}
            </span>
            <span className={cn(hasChanges(filePath) && "italic")}>
              {getFileName(filePath)}
            </span>
            {saveMutation.isPending &&
            saveMutation.variables?.path === filePath ? (
              <Loader2Icon className="ml-1 h-3 w-3 animate-spin" />
            ) : hasChanges(filePath) ? (
              <span className="ml-1 h-2 w-2 rounded-full bg-orange-500" />
            ) : null}
            <button
              type="button"
              className="ml-1 rounded p-0.5 opacity-0 hover:bg-[#3c3c3c] group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                onFileClose(filePath);
              }}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Breadcrumb */}
      {activeFile && (
        <div className="flex items-center gap-1 border-b border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 text-xs text-muted-foreground">
          {activeFile
            .split("/")
            .reduce<{
              parts: { key: string; part: string; isLast: boolean }[];
              path: string;
            }>(
              (acc, part, i, arr) => {
                const path = acc.path ? `${acc.path}/${part}` : part;
                acc.parts.push({
                  key: path,
                  part,
                  isLast: i === arr.length - 1,
                });
                acc.path = path;
                return acc;
              },
              { parts: [], path: "" },
            )
            .parts.map((item, i) => (
              <span key={item.key} className="flex items-center gap-1">
                {i > 0 && <span className="text-[#6e6e6e]">&gt;</span>}
                <span className={item.isLast ? "text-foreground" : ""}>
                  {item.part}
                </span>
              </span>
            ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {activeFile && isFileLoading(activeFile) ? (
          <div className="flex h-full items-center justify-center">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : activeFile && getFileError(activeFile) ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-destructive">{getFileError(activeFile)}</p>
          </div>
        ) : activeFile ? (
          <CodeEditor
            key={activeFile}
            path={activeFile}
            defaultValue={displayContent}
            onChange={handleEditorChange}
            onSave={handleSave}
            className="h-full"
          />
        ) : null}
      </div>

      {/* Save error toast */}
      {saveMutation.isError && (
        <div className="absolute bottom-4 right-4 rounded bg-destructive px-3 py-2 text-sm text-destructive-foreground">
          {saveMutation.error.message}
        </div>
      )}
    </div>
  );
}
