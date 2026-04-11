"use client";

import { FitAddon, type Terminal as GhosttyTerminal, init } from "ghostty-web";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface TerminalHandle {
  /** Write data to the terminal */
  write: (data: string) => void;
  /** Clear the terminal */
  clear: () => void;
  /** Focus the terminal */
  focus: () => void;
  /** Get current dimensions */
  dimensions: () => { cols: number; rows: number } | null;
  /** Refit terminal to container size */
  fit: () => void;
}

export interface TerminalProps {
  /** Called when user types in terminal */
  onData?: (data: string) => void;
  /** Called when terminal is resized */
  onResize?: (cols: number, rows: number) => void;
  /** Called when terminal is ready */
  onReady?: () => void;
  /** Font size in pixels */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Theme colors */
  theme?: {
    background?: string;
    foreground?: string;
    cursor?: string;
  };
  /** Whether the cursor should blink */
  cursorBlink?: boolean;
  /** Disable stdin (make terminal read-only) */
  disableStdin?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Additional inline styles */
  style?: React.CSSProperties;
}

// Track if WASM has been initialized globally
let wasmInitialized = false;
let wasmInitPromise: Promise<void> | null = null;

async function ensureInit(): Promise<void> {
  if (wasmInitialized) return;
  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = init().then(() => {
    wasmInitialized = true;
  });

  return wasmInitPromise;
}

export const Terminal = forwardRef<TerminalHandle, TerminalProps>(
  function Terminal(
    {
      onData,
      onResize,
      onReady,
      fontSize = 14,
      fontFamily = 'Monaco, Menlo, "Courier New", monospace',
      theme = {},
      cursorBlink = true,
      disableStdin = false,
      className,
      style,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const terminalRef = useRef<GhosttyTerminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const writeQueueRef = useRef<string[]>([]);
    const isReadyRef = useRef(false);
    const [, setRenderTrigger] = useState(0);

    // Store callbacks in refs to avoid effect re-runs
    const onDataRef = useRef(onData);
    const onResizeRef = useRef(onResize);
    const onReadyRef = useRef(onReady);
    onDataRef.current = onData;
    onResizeRef.current = onResize;
    onReadyRef.current = onReady;

    // Flush queued writes to terminal
    const flushQueue = useCallback(() => {
      const term = terminalRef.current;
      if (!term || !isReadyRef.current) return;

      const queue = writeQueueRef.current;
      if (queue.length === 0) return;

      // Clear queue before writing to prevent infinite loops
      writeQueueRef.current = [];

      // Batch all queued writes
      const combined = queue.join("");
      try {
        term.write(combined);
      } catch (err) {
        console.error("[Terminal] Write error:", err);
      }
    }, []);

    // Safe write function that queues if not ready
    const safeWrite = useCallback((data: string) => {
      if (isReadyRef.current && terminalRef.current) {
        try {
          terminalRef.current.write(data);
        } catch (err) {
          console.error("[Terminal] Write error:", err);
        }
      } else {
        writeQueueRef.current.push(data);
      }
    }, []);

    // Expose imperative handle
    useImperativeHandle(
      ref,
      () => ({
        write: safeWrite,
        clear: () => {
          terminalRef.current?.clear();
        },
        focus: () => {
          terminalRef.current?.focus();
        },
        dimensions: () => {
          const term = terminalRef.current;
          if (!term) return null;
          return { cols: term.cols, rows: term.rows };
        },
        fit: () => {
          fitAddonRef.current?.fit();
        },
      }),
      [safeWrite],
    );

    useEffect(() => {
      let disposed = false;
      let term: GhosttyTerminal | null = null;
      let fitAddon: FitAddon | null = null;

      async function setup() {
        if (!containerRef.current || disposed) return;

        // Initialize WASM
        await ensureInit();
        if (disposed) return;

        // Dynamically import Terminal to avoid SSR issues
        const { Terminal: GhosttyTerminalClass } = await import("ghostty-web");
        if (disposed) return;

        // Terminal colors
        const bg = theme.background ?? "#1a1a1a";
        const fg = theme.foreground ?? "#f5f5f5";
        const cur = theme.cursor ?? "#f5f5f5";

        term = new GhosttyTerminalClass({
          cols: 80,
          rows: 24,
          cursorBlink,
          disableStdin,
          fontSize,
          fontFamily,
          theme: { background: bg, foreground: fg, cursor: cur },
          scrollback: 10000,
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(containerRef.current);

        // Fit to container and auto-resize on container changes
        // Small delay to ensure container is fully rendered
        await new Promise((resolve) => setTimeout(resolve, 10));
        fitAddon.fit();
        fitAddon.observeResize();

        terminalRef.current = term;
        fitAddonRef.current = fitAddon;

        // Set up event handlers using refs (so they always use latest callbacks)
        term.onData((data) => {
          onDataRef.current?.(data);
        });

        term.onResize(({ cols, rows }) => {
          onResizeRef.current?.(cols, rows);
        });

        // Wait for terminal to fully initialize
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (disposed) return;

        // Fit again after initialization to ensure correct sizing
        fitAddon.fit();

        isReadyRef.current = true;
        setRenderTrigger((n) => n + 1);
        flushQueue();
        onReadyRef.current?.();
      }

      setup();

      return () => {
        disposed = true;
        isReadyRef.current = false;
        fitAddon?.dispose();
        term?.dispose();
        terminalRef.current = null;
        fitAddonRef.current = null;
        writeQueueRef.current = [];
      };
      // Only re-create terminal when visual config changes, not callbacks
    }, [
      fontSize,
      fontFamily,
      theme.background,
      theme.foreground,
      theme.cursor,
      cursorBlink,
      disableStdin,
      flushQueue,
    ]);

    return (
      <div
        className={`h-full w-full overflow-hidden box-border p-2 relative border-4 border-border ${className ?? ""}`}
        style={{
          backgroundColor: theme.background ?? "#1a1a1a",
          ...style,
        }}
      >
        <div
          ref={containerRef}
          className="h-full w-full overflow-hidden relative"
        />
      </div>
    );
  },
);
