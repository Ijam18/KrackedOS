"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { CheckIcon, SparklesIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PromptLimitModal } from "@/components/prompt-limit-modal";
import { Spinner } from "@/components/ui/spinner";
import { GuestBanner } from "@/features/auth/components/guest-banner";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useBrowserNotification } from "@/hooks/use-browser-notification";
import { cn } from "@/lib/ui/utils";
import {
  PROMPT_MAX_LENGTH,
  validatePrompt,
  wouldExceedPromptLimit,
} from "@/lib/validation/prompt";
import { FollowUpCard, type FollowUpQuestion } from "./follow-up-card";

interface ProgressItem {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "completed";
}

interface ProgressTurn {
  id: string;
  userQuery: string;
  items: ProgressItem[];
  questions: FollowUpQuestion[];
  isCurrentTurn: boolean;
}

export interface CookingProgress {
  completed: number;
  total: number;
  currentLabel: string | null;
  activeTool: string | null;
  isReasoning: boolean;
}

function formatToolCall(
  toolName: string,
  input?: Record<string, unknown>,
): string {
  switch (toolName) {
    case "readFile": {
      const path = (input?.path as string) ?? "";
      return `Reading ${path.split("/").pop() ?? path}`;
    }
    case "writeFile": {
      const path = (input?.path as string) ?? "";
      return `Writing ${path.split("/").pop() ?? path}`;
    }
    case "listFiles": {
      const path = (input?.path as string) ?? "";
      return `Browsing ${path || "files"}`;
    }
    case "runCommand": {
      const cmd = (input?.command as string) ?? "";
      return `Running: ${cmd.length > 50 ? `${cmd.slice(0, 47)}…` : cmd}`;
    }
    default:
      return toolName;
  }
}

function isActivelyReasoning(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant" || !msg.parts) continue;
    for (const part of msg.parts) {
      const p = part as Record<string, unknown>;
      if (p.type === "reasoning" && p.state === "streaming") return true;
    }
    break; // only check the last assistant message
  }
  return false;
}

function hasStreamFinished(messages: UIMessage[]): boolean {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant" || !msg.parts) continue;
    for (const part of msg.parts) {
      const p = part as Record<string, unknown>;
      // Detect finish event - streaming is complete
      if (p.type === "finish" || p.type === "finish-step") return true;
    }
    break; // only check the last assistant message
  }
  return false;
}

function getActiveTool(messages: UIMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant" || !msg.parts) continue;

    for (let j = msg.parts.length - 1; j >= 0; j--) {
      const p = msg.parts[j] as Record<string, unknown>;
      const type = String(p.type || "");
      const state = String(p.state || "");

      // Skip completed/error states (tool is done)
      if (/output|complete|error|finish/i.test(state)) continue;

      // Must be tool-related (loose matching)
      if (!/tool/i.test(type)) continue;

      // Extract tool name: prefer explicit field, fallback to parsing
      let toolName = String(p.toolName || "");

      if (!toolName && type.includes("-")) {
        // Parse from type: "tool-input-readFile" → "readFile"
        // Handles variations: "tool-readFile", "tool-input-start-readFile"
        const parts = type.split("-");
        // Skip "tool" prefix and state words (input, output, start, delta, etc.)
        const stateWords =
          /^(input|output|start|delta|available|call|result)$/i;
        toolName = parts
          .slice(1)
          .filter((p) => !stateWords.test(p))
          .join("-");
      }

      // Skip meta/ui tools (case-insensitive)
      if (!toolName || /updateProgress|askFollowUp|setIdle/i.test(toolName)) {
        continue;
      }

      return formatToolCall(
        toolName,
        p.input as Record<string, unknown> | undefined,
      );
    }
    break;
  }
  return null;
}

interface ProgressPanelProps {
  sessionId: string;
  isReady: boolean;
  initialMessages?: UIMessage[];
  initialPrompt?: string | null;
  appTitle?: string | null;
  onToolExecuted?: () => void;
  onStatusChange?: (status: string) => void;
  onProgressChange?: (progress: CookingProgress) => void;
}

export function ProgressPanel({
  sessionId,
  isReady,
  initialMessages = [],
  initialPrompt,
  appTitle,
  onToolExecuted,
  onStatusChange,
  onProgressChange,
}: ProgressPanelProps) {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPromptLimitModal, setShowPromptLimitModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { isGuest } = useAuth();
  const { permission, requestPermission, notify } = useBrowserNotification();
  const prevStatusRef = useRef<string | null>(null);

  // Refs to track one-time actions (persists across Strict Mode remounts)
  const hasSentInitialPrompt = useRef(false);

  // Memoize transport to prevent recreating on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { sessionId },
        prepareReconnectToStreamRequest: () => ({
          api: `/api/chat?appId=${sessionId}&resume=true`,
        }),
      }),
    [sessionId],
  );

  const { messages, sendMessage, status, resumeStream } = useChat({
    transport,
    messages: initialMessages,
  });

  // On mount, attempt to reconnect to any active stream (handles page-refresh mid-generation)
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run on mount
  useEffect(() => {
    // Defer to ensure useChat internal Chat class is initialized
    const timer = setTimeout(() => {
      resumeStream();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Merge streaming messages with initialMessages so DB history is always visible
  // during and after resume (streaming messages may only contain the new turn)
  const mergedMessages = useMemo(() => {
    if (status === "ready" || messages.length <= initialMessages.length) {
      return messages;
    }
    const initialIds = new Set(initialMessages.map((m) => m.id));
    const newOnly = messages.filter((m) => !initialIds.has(m.id));
    return newOnly.length > 0 ? [...initialMessages, ...newOnly] : messages;
  }, [status, messages, initialMessages]);

  // Send initial prompt if provided (new app flow)
  useEffect(() => {
    if (
      initialPrompt &&
      isReady &&
      status === "ready" &&
      !hasSentInitialPrompt.current
    ) {
      const nextValidationError = validatePrompt(initialPrompt);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      hasSentInitialPrompt.current = true;
      setValidationError(null);
      sendMessage({ text: initialPrompt });
    }
  }, [initialPrompt, isReady, status, sendMessage]);

  // Notify parent of status changes (basic — augmented below after turn extraction)
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Send browser notification when generation completes (streaming → ready)
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming";
    const isNowReady = status === "ready";

    if (wasStreaming && isNowReady) {
      notify("Generation Complete", {
        body: "Your app is ready to preview!",
        url: `/apps/${sessionId}`,
      });
    }

    prevStatusRef.current = status;
  }, [status, notify, sessionId]);

  // Track tool results to trigger refresh when files are written
  const seenToolResultsRef = useRef(new Set<string>());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-populate seen tool results from initial messages
  useEffect(() => {
    for (const message of initialMessages) {
      if (message.parts) {
        for (const part of message.parts) {
          const p = part as Record<string, unknown>;
          const type = p.type as string;
          const state = p.state as string;
          const toolCallId = p.toolCallId as string;

          if (
            type?.startsWith("tool-") &&
            state === "output-available" &&
            toolCallId
          ) {
            seenToolResultsRef.current.add(`${message.id}-${toolCallId}`);
          }
        }
      }
    }
  }, [initialMessages]);

  useEffect(() => {
    let hasNewResult = false;

    for (const message of mergedMessages) {
      if (message.parts) {
        for (const part of message.parts) {
          const p = part as Record<string, unknown>;
          const type = p.type as string;
          const state = p.state as string;
          const toolCallId = p.toolCallId as string;

          if (
            type?.startsWith("tool-") &&
            state === "output-available" &&
            toolCallId
          ) {
            const resultId = `${message.id}-${toolCallId}`;

            if (!seenToolResultsRef.current.has(resultId)) {
              seenToolResultsRef.current.add(resultId);

              // Only refresh for file writes and command runs
              if (type === "tool-writeFile" || type === "tool-runCommand") {
                hasNewResult = true;
              }
            }
          }
        }
      }
    }

    if (hasNewResult) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        onToolExecuted?.();
        refreshTimerRef.current = null;
      }, 1000);
    }
  }, [mergedMessages, onToolExecuted]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(
    ({ text }: { text: string }) => {
      if (!isReady) return;

      const nextValidationError = validatePrompt(text);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      // Request notification permission on user gesture (first generation)
      if (permission === "default") {
        requestPermission();
      }

      setValidationError(null);
      sendMessage({ text: text.trim() });
      setInput("");
    },
    [isReady, sendMessage, permission, requestPermission],
  );

  // Extract progress turns - each turn is a user query + its associated progress items + questions
  const { turns, currentTurnHasProgress, currentTurnHasQuestions } =
    useMemo(() => {
      const result: ProgressTurn[] = [];
      let currentUserQuery: string | null = null;
      let currentUserMessageId: string | null = null;
      let currentItems: ProgressItem[] = [];
      let currentQuestions: FollowUpQuestion[] = [];

      for (const message of mergedMessages) {
        if (message.role === "user" && message.parts) {
          // If we have a previous turn, save it
          if (currentUserQuery !== null) {
            result.push({
              id: currentUserMessageId || `turn-${result.length}`,
              userQuery: currentUserQuery,
              items: currentItems,
              questions: currentQuestions,
              isCurrentTurn: false,
            });
          }

          // Start new turn
          for (const part of message.parts) {
            const p = part as Record<string, unknown>;
            if (p.type === "text" && typeof p.text === "string") {
              currentUserQuery = p.text;
              currentUserMessageId = message.id;
              currentItems = [];
              currentQuestions = [];
              break;
            }
          }
        }

        // Extract progress items and follow-up questions from assistant messages
        if (message.role === "assistant" && message.parts) {
          for (const part of message.parts) {
            const p = part as Record<string, unknown>;
            const type = p.type as string;

            if (type === "tool-updateProgress") {
              const toolInput = p.input as
                | { items?: ProgressItem[] }
                | undefined;
              if (toolInput?.items) {
                currentItems = toolInput.items;
              }
            }

            if (type === "tool-askFollowUp") {
              const toolInput = p.input as
                | { questions?: FollowUpQuestion[] }
                | undefined;
              if (toolInput?.questions) {
                currentQuestions = toolInput.questions;
              }
            }
          }
        }
      }

      // Add the last/current turn
      if (currentUserQuery !== null) {
        result.push({
          id: currentUserMessageId || `turn-${result.length}`,
          userQuery: currentUserQuery,
          items: currentItems,
          questions: currentQuestions,
          isCurrentTurn: true,
        });
      }

      // Handle initial prompt that hasn't been sent yet
      if (result.length === 0 && initialPrompt) {
        result.push({
          id: "initial",
          userQuery: initialPrompt,
          items: [],
          questions: [],
          isCurrentTurn: true,
        });
      }

      // Mark all but the last as not current
      if (result.length > 0) {
        for (let i = 0; i < result.length - 1; i++) {
          result[i].isCurrentTurn = false;
        }
        result[result.length - 1].isCurrentTurn = true;
      }

      const lastTurn = result[result.length - 1];
      const hasProgress = lastTurn?.items.length > 0;
      const hasQuestions = lastTurn?.questions.length > 0;

      return {
        turns: result,
        currentTurnHasProgress: hasProgress,
        currentTurnHasQuestions: hasQuestions,
      };
    }, [mergedMessages, initialPrompt]);

  // Emit progress changes to parent (only forward progress, never go backwards)
  const lastEmittedRef = useRef<CookingProgress>({
    completed: 0,
    total: 0,
    currentLabel: null,
    activeTool: null,
    isReasoning: false,
  });

  // Track last active tool to keep animation running between finish-step and start-step
  const lastActiveToolRef = useRef<string | null>(null);

  useEffect(() => {
    if (!onProgressChange) return;
    const currentTurnData = turns[turns.length - 1];
    const isReasoning = isActivelyReasoning(mergedMessages);

    if (!currentTurnData || currentTurnData.items.length === 0) {
      // No progress items yet — only emit if reasoning state changed
      if (isReasoning !== lastEmittedRef.current.isReasoning) {
        const next = { ...lastEmittedRef.current, isReasoning };
        lastEmittedRef.current = next;
        onProgressChange(next);
      }
      return;
    }

    const completed = currentTurnData.items.filter(
      (i) => i.status === "completed",
    ).length;
    const total = currentTurnData.items.length;
    const inProgress = currentTurnData.items.find(
      (i) => i.status === "in_progress",
    );
    const currentActiveTool = getActiveTool(mergedMessages);

    // Keep last active tool during gaps between finish-step and start-step
    // Clear immediately on finish event or when streaming ends
    const streamFinished = hasStreamFinished(mergedMessages);
    if (streamFinished || status !== "streaming") {
      // Stream is done - clear the tool
      lastActiveToolRef.current = null;
    } else if (currentActiveTool) {
      // New tool is active - update it
      lastActiveToolRef.current = currentActiveTool;
    }

    const activeTool = currentActiveTool ?? lastActiveToolRef.current;

    const next: CookingProgress = {
      completed,
      total,
      currentLabel: inProgress?.label ?? lastEmittedRef.current.currentLabel,
      activeTool,
      isReasoning,
    };

    // Only emit if something actually changed
    const prev = lastEmittedRef.current;
    if (
      prev.completed !== next.completed ||
      prev.total !== next.total ||
      prev.currentLabel !== next.currentLabel ||
      prev.activeTool !== next.activeTool ||
      prev.isReasoning !== next.isReasoning
    ) {
      lastEmittedRef.current = next;
      onProgressChange(next);
    }
  }, [turns, mergedMessages, onProgressChange, status]);

  // Override status when the stream ended with follow-up questions
  // so the preview panel can show a "waiting for input" screen
  useEffect(() => {
    if (status === "ready" && currentTurnHasQuestions) {
      onStatusChange?.("awaiting-input");
    }
  }, [status, currentTurnHasQuestions, onStatusChange]);

  // Auto-scroll to bottom when messages change (which affects turns)
  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to scroll when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [mergedMessages]);

  // Handle follow-up question answers — sends as a regular chat message
  const handleFollowUpAnswer = useCallback(
    (answer: string) => {
      if (!isReady) return;

      const nextValidationError = validatePrompt(answer);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      if (permission === "default") {
        requestPermission();
      }

      setValidationError(null);
      sendMessage({ text: answer.trim() });
    },
    [isReady, sendMessage, permission, requestPermission],
  );

  const isWorking = status === "streaming" || status === "submitted";
  const hasStarted = mergedMessages.length > 0 || (initialPrompt && isWorking);
  // Show the regular input when not working, ready, AND not waiting for a follow-up answer
  const showInput = !currentTurnHasQuestions;
  // Show follow-up questions when the stream ended with questions and we're not working
  const showFollowUp = !isWorking && isReady && currentTurnHasQuestions;

  const currentTurn = turns[turns.length - 1];
  const allCompleted =
    currentTurn?.items.length > 0 &&
    currentTurn.items.every((item) => item.status === "completed");

  // Flatten all progress items across all turns
  const allItems = turns.flatMap((turn) =>
    turn.items.map((item) => ({ ...item, turnId: turn.id })),
  );

  return (
    <div className="flex h-full flex-col font-mono overflow-hidden gap-4">
      {/* Main progress card - scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-0 border border-border bg-card rounded-xl p-6 overflow-auto"
      >
        {!hasStarted ? (
          // Empty state
          <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
            <SparklesIcon className="size-10 text-primary" />
            <h3 className="font-mono text-sm text-foreground">
              READY TO BUILD
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              Describe your quest. Code runs in an isolated sandbox.
            </p>
          </div>
        ) : (
          <>
            {appTitle && (
              <h2 className="font-mono text-xl text-foreground mb-6">
                {appTitle}
              </h2>
            )}

            {allItems.length > 0 && (
              <div className="space-y-4">
                {allItems.map((item, index) => (
                  <ProgressItemRow
                    key={`${item.turnId}-${item.id}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            )}

            {/* Thinking indicator */}
            {isWorking &&
              !currentTurnHasProgress &&
              !currentTurnHasQuestions &&
              currentTurn && (
                <div className="flex items-center justify-center text-center py-4">
                  <Shimmer className="text-sm">Considering next steps…</Shimmer>
                </div>
              )}

            {/* Follow-up questions from AI */}
            {showFollowUp && currentTurn?.questions.length > 0 && (
              <div className="pt-4">
                <FollowUpCard
                  questions={currentTurn.questions}
                  onAnswer={handleFollowUpAnswer}
                  disabled={!isReady}
                />
              </div>
            )}

            {/* Guest banner */}
            {allCompleted &&
              !isWorking &&
              !currentTurnHasQuestions &&
              isGuest && (
                <div className="pt-4">
                  <GuestBanner />
                </div>
              )}
          </>
        )}
      </div>

      {/* Input Area - separate card, fixed at bottom */}
      {showInput && (
        <div className="flex-shrink-0 border border-border bg-card rounded-xl">
          <PromptInput
            onSubmit={handleSubmit}
            className="[&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0"
          >
            <PromptInputTextarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (validationError) {
                  setValidationError(null);
                }
              }}
              onPaste={(event) => {
                const pastedText = event.clipboardData.getData("text");
                if (!pastedText) {
                  return;
                }

                if (
                  wouldExceedPromptLimit({
                    currentText: event.currentTarget.value,
                    selectionStart: event.currentTarget.selectionStart,
                    selectionEnd: event.currentTarget.selectionEnd,
                    pastedText,
                  })
                ) {
                  event.preventDefault();
                  setShowPromptLimitModal(true);
                }
              }}
              placeholder={
                hasStarted
                  ? "> Tell me what to change..."
                  : "> Describe what you want to build..."
              }
              disabled={!isReady}
              className="min-h-[80px] border-0 bg-transparent text-foreground font-mono placeholder-muted-foreground focus-visible:ring-0 focus-visible:border-0 p-4"
            />
            <PromptInputFooter className="bg-transparent px-4 py-3 flex justify-end">
              <div className="flex items-center gap-2">
                {!isReady && (
                  <span className="font-mono text-xs text-muted-foreground">
                    Loading...
                  </span>
                )}
                <span className="font-mono text-xs text-muted-foreground">
                  {input.length}/{PROMPT_MAX_LENGTH}
                </span>
              </div>
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() || !isReady}
                className="bg-primary text-primary-foreground hover:bg-primary/80"
              />
            </PromptInputFooter>
          </PromptInput>
          {validationError ? (
            <p className="px-4 pb-3 font-mono text-xs text-destructive">
              {validationError}
            </p>
          ) : null}
          <PromptLimitModal
            open={showPromptLimitModal}
            onOpenChange={setShowPromptLimitModal}
          />
        </div>
      )}
    </div>
  );
}

interface ProgressItemRowProps {
  item: ProgressItem;
}

function ProgressItemRow({ item }: ProgressItemRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0">
        {item.status === "completed" ? (
          <div className="size-8 flex items-center justify-center border border-muted-foreground/30 rounded-md bg-muted/30">
            <CheckIcon className="size-4 text-muted-foreground" />
          </div>
        ) : item.status === "in_progress" ? (
          <div className="size-8 flex items-center justify-center border border-border rounded-md">
            <Spinner className="size-4 text-foreground" />
          </div>
        ) : (
          <div className="size-8 border border-border rounded-md" />
        )}
      </div>
      <span
        className={cn(
          "text-sm",
          item.status === "completed" && "text-muted-foreground",
          item.status === "in_progress" && "text-muted-foreground",
          item.status === "pending" && "text-muted-foreground",
        )}
      >
        {item.label}
      </span>
    </div>
  );
}
