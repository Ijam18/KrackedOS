"use client";

import { ChevronUpIcon, TrashIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/ui/utils";
import { type LogLine, useSandboxLogs } from "../hooks/use-sandbox-logs";

// Strip ANSI escape codes from text
function stripAnsi(str: string): string {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentionally stripping ANSI codes
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

// Format timestamp
function formatTime(timestamp?: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

interface LogsPanelProps {
  sessionId: string;
  isReady: boolean;
}

export function LogsPanel({ sessionId, isReady }: LogsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { logs, isConnected, error, connect, clear } =
    useSandboxLogs(sessionId);

  // Auto-scroll to bottom when new logs arrive
  const prevLogsLengthRef = useRef(0);
  if (logs.length > prevLogsLengthRef.current && scrollRef.current) {
    // Schedule scroll after render
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 0);
    prevLogsLengthRef.current = logs.length;
  }

  // Handle expand/collapse toggle
  const handleToggle = useCallback(() => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);

    if (willExpand && isReady && !isConnected) {
      connect();
    }
  }, [isExpanded, isReady, isConnected, connect]);

  // Handle clear
  const handleClear = useCallback(() => {
    clear();
    prevLogsLengthRef.current = 0;
  }, [clear]);

  return (
    <div
      className={cn(
        "flex flex-col flex-shrink-0 border-t border-border bg-background transition-[height] duration-200",
        isExpanded ? "h-64" : "h-10",
      )}
    >
      {/* Header */}
      <div className="flex h-10 flex-shrink-0 items-center justify-between border-b border-border bg-card px-3">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ChevronUpIcon
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-180",
            )}
          />
          <span className="font-mono text-[10px]">CONSOLE</span>
          {isConnected && <span className="h-2 w-2 bg-primary rounded-full" />}
        </button>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-destructive font-mono">{error}</span>
          )}
          <button
            type="button"
            onClick={handleClear}
            className="border border-border p-1 text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-md"
            title="Clear logs"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Log entries - Retro Terminal Style */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto font-mono text-xs bg-card border border-border rounded-md p-2"
        >
          <table className="w-full border-collapse">
            <tbody>
              {logs.map((log, index) => (
                <LogRow key={`${log.timestamp}-${index}`} log={log} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LogRow({ log }: { log: LogLine }) {
  if (!log.data && log.type !== "exit") return null;

  const lines = log.data?.split("\n").filter((line) => line.trim()) ?? [];
  if (lines.length === 0 && log.type !== "exit") return null;

  const isError = log.type === "stderr";
  const isExit = log.type === "exit";

  if (isExit) {
    return (
      <tr className="border-l-4 border-yellow-500">
        <td className="whitespace-nowrap px-3 py-1 text-muted-foreground align-top font-mono">
          [{formatTime(log.timestamp)}]
        </td>
        <td className="px-3 py-1 text-yellow-400">
          {">"} PROCESS EXIT CODE: {log.exit_code}
        </td>
      </tr>
    );
  }

  return (
    <>
      {lines.map((line, i) => (
        <tr
          key={`${log.timestamp}-${i}-${line.slice(0, 20)}`}
          className={cn(
            "border-l-4",
            isError ? "border-destructive" : "border-primary/50",
          )}
        >
          <td className="whitespace-nowrap px-3 py-1 text-muted-foreground/70 align-top">
            {i === 0 ? `[${formatTime(log.timestamp)}]` : ""}
          </td>
          <td
            className={cn(
              "px-3 py-1 whitespace-pre-wrap break-all",
              isError ? "text-destructive" : "text-primary",
            )}
          >
            <span className="text-muted-foreground/50">{">"}</span>{" "}
            {stripAnsi(line)}
          </td>
        </tr>
      ))}
    </>
  );
}
