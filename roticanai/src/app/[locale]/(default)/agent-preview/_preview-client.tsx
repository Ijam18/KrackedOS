"use client";

import { useEffect, useState } from "react";

import { AgentScene } from "@/components/agent-visualization/agent-scene";

// Simulated agent action sequence
const STEPS: Array<{
  label: string | null;
  task: string | null;
  reasoning: boolean;
  duration: number; // ms
}> = [
  { label: null, task: null, reasoning: false, duration: 1500 },
  { label: null, task: null, reasoning: true, duration: 2500 },
  {
    label: "Reading src/app/page.tsx",
    task: "Understanding the app structure",
    reasoning: false,
    duration: 3000,
  },
  {
    label: "Searching for Button component",
    task: "Understanding the app structure",
    reasoning: false,
    duration: 2500,
  },
  {
    label: "Analyzing dependencies",
    task: "Understanding the app structure",
    reasoning: false,
    duration: 2000,
  },
  {
    label: "Writing src/components/Hero.tsx",
    task: "Building the landing page",
    reasoning: false,
    duration: 4000,
  },
  {
    label: "Writing src/components/FeatureGrid.tsx",
    task: "Building the landing page",
    reasoning: false,
    duration: 3500,
  },
  {
    label: "Running: bun install",
    task: "Installing dependencies",
    reasoning: false,
    duration: 3000,
  },
  {
    label: "Fetching data from API",
    task: "Loading user preferences",
    reasoning: false,
    duration: 2000,
  },
  { label: null, task: null, reasoning: true, duration: 2000 },
  {
    label: "Checking src/styles/globals.css",
    task: "Fixing layout issues",
    reasoning: false,
    duration: 2500,
  },
  {
    label: "Writing src/styles/globals.css",
    task: "Fixing layout issues",
    reasoning: false,
    duration: 3000,
  },
  { label: null, task: null, reasoning: false, duration: 2000 },
];

export function AgentPreviewClient() {
  const [stepIdx, setStepIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = STEPS[stepIdx % STEPS.length];

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => {
      setStepIdx((i) => i + 1);
    }, step.duration);
    return () => clearTimeout(t);
  }, [paused, step.duration]);

  return (
    <div className="flex flex-col items-center gap-8 p-8 min-h-screen bg-zinc-950">
      <div className="flex flex-col items-center gap-1">
        <h1 className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
          Agent Scene Preview
        </h1>
        <p className="font-mono text-[10px] text-zinc-600">
          /agent-preview — throwaway dev route
        </p>
      </div>

      {/* Scene at native size */}
      <div className="w-[960px] h-[640px] shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10">
        <AgentScene
          currentLabel={step.label}
          taskLabel={step.task}
          isReasoning={step.reasoning}
        />
      </div>

      {/* Scene scaled down (as it appears in the sidebar) */}
      <div className="w-64 h-44 shrink-0 rounded-lg overflow-hidden ring-1 ring-white/10">
        <AgentScene
          currentLabel={step.label}
          taskLabel={step.task}
          isReasoning={step.reasoning}
        />
      </div>

      {/* Current state readout */}
      <div className="font-mono text-xs text-zinc-400 flex flex-col gap-1 text-center">
        <div>
          <span className="text-zinc-600">step </span>
          <span className="text-zinc-300">
            {(stepIdx % STEPS.length) + 1}/{STEPS.length}
          </span>
        </div>
        <div>
          <span className="text-zinc-600">label </span>
          <span className="text-zinc-300">{step.label ?? "—"}</span>
        </div>
        <div>
          <span className="text-zinc-600">task </span>
          <span className="text-zinc-300">{step.task ?? "—"}</span>
        </div>
        <div>
          <span className="text-zinc-600">reasoning </span>
          <span className="text-zinc-300">{step.reasoning ? "yes" : "no"}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="font-mono text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          {paused ? "resume" : "pause"}
        </button>
        <button
          type="button"
          onClick={() =>
            setStepIdx((i) => (i - 1 + STEPS.length) % STEPS.length)
          }
          className="font-mono text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          ← prev
        </button>
        <button
          type="button"
          onClick={() => setStepIdx((i) => i + 1)}
          className="font-mono text-xs px-3 py-1.5 rounded border border-zinc-700 text-zinc-300 hover:border-zinc-500 transition-colors"
        >
          next →
        </button>
      </div>
    </div>
  );
}
