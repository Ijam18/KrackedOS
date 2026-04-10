"use client";

import { useCallback, useRef, useState } from "react";

export interface LogLine {
  type: "stdout" | "stderr" | "error" | "exit" | "complete";
  data?: string;
  exit_code?: number;
  timestamp?: number;
}

export interface UseSandboxLogsResult {
  logs: LogLine[];
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  clear: () => void;
}

export function useSandboxLogs(sessionId: string): UseSandboxLogsResult {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(async () => {
    if (isConnectingRef.current || abortControllerRef.current) return;
    isConnectingRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsConnected(true);
    setError(null);

    const response = await fetch(`/api/sandbox/logs?sessionId=${sessionId}`, {
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      setError("Failed to connect to logs");
      setIsConnected(false);
      abortControllerRef.current = null;
      isConnectingRef.current = false;
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const readResult = await reader.read();
      if (readResult.done) break;

      buffer += decoder.decode(readResult.value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      let currentEvent = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) {
          currentEvent = line.slice(7);
        } else if (line.startsWith("data: ") && currentEvent) {
          const data = JSON.parse(line.slice(6));

          if (currentEvent === "log") {
            setLogs((prev) => [...prev, data as LogLine]);
          } else if (currentEvent === "error") {
            setError(data.message);
          }
          currentEvent = "";
        }
      }
    }

    setIsConnected(false);
    abortControllerRef.current = null;
    isConnectingRef.current = false;
  }, [sessionId]);

  const disconnect = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsConnected(false);
    isConnectingRef.current = false;
  }, []);

  const clear = useCallback(() => {
    setLogs([]);
  }, []);

  return { logs, isConnected, error, connect, disconnect, clear };
}
