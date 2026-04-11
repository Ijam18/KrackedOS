"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/ui/utils";

// Canvas dimensions (must match pixi-scene.ts constants)
const CANVAS_W = 960; // 6 cols × 160 px
const CANVAS_H = 640; // 4 rows × 160 px

interface AgentSceneProps {
  currentLabel: string | null;
  taskLabel?: string | null;
  isReasoning?: boolean;
  className?: string;
}

export function AgentScene({
  currentLabel,
  taskLabel,
  isReasoning,
  className,
}: AgentSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Use refs so the rAF ticker always reads the latest values without needing
  // to tear down and recreate the Pixi app on every prop change.
  const labelRef = useRef<string | null>(null);
  const taskLabelRef = useRef<string | null>(null);
  const isReasoningRef = useRef(false);

  labelRef.current = currentLabel;
  taskLabelRef.current = taskLabel ?? null;
  isReasoningRef.current = isReasoning ?? false;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let destroyed = false;
    // Keep a handle so the cleanup function can call destroy() even if init
    // hasn't finished yet (unlikely but safe).
    let sceneDestroy: (() => void) | null = null;
    let tickerRemove: (() => void) | null = null;

    (async () => {
      // Dynamic imports keep Pixi out of the SSR bundle entirely.
      const [{ Application }, { createPixiScene }] = await Promise.all([
        import("pixi.js"),
        import("@/components/office-engine/pixi-scene"),
      ]);

      if (destroyed) return;

      const app = new Application();
      await app.init({
        width: CANVAS_W,
        height: CANVAS_H,
        backgroundAlpha: 0,
        antialias: false,
      });

      if (destroyed) {
        app.destroy(true, { children: true });
        return;
      }

      // Mount the Pixi canvas
      const canvas = app.canvas as HTMLCanvasElement;
      canvas.style.imageRendering = "pixelated";
      canvas.style.width = "100%";
      canvas.style.height = "auto";
      canvas.style.maxHeight = "100%";
      el.appendChild(canvas);

      const scene = await createPixiScene(app);
      if (destroyed) {
        scene.destroy();
        app.destroy(true, { children: true });
        return;
      }

      sceneDestroy = () => {
        scene.destroy();
        app.destroy(true, { children: true });
      };

      // Drive the scene from Pixi's own ticker (replaces manual rAF loop)
      const onTick = (ticker: { elapsedMS: number }) => {
        const dt = Math.min(ticker.elapsedMS / 1000, 0.1);
        scene.update(
          dt,
          labelRef.current,
          taskLabelRef.current,
          isReasoningRef.current,
        );
      };
      app.ticker.add(onTick);
      tickerRemove = () => app.ticker.remove(onTick);
    })();

    return () => {
      destroyed = true;
      tickerRemove?.();
      sceneDestroy?.();
      // Remove the canvas from DOM if it was appended
      while (el.firstChild) el.removeChild(el.firstChild);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex items-center justify-center w-full h-full",
        className,
      )}
    />
  );
}
