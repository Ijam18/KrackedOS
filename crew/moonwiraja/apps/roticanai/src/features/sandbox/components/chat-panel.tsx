"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { CopyIcon, RefreshCcwIcon, SparklesIcon } from "lucide-react";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { PromptLimitModal } from "@/components/prompt-limit-modal";
import { cn } from "@/lib/ui/utils";
import {
  PROMPT_MAX_LENGTH,
  validatePrompt,
  wouldExceedPromptLimit,
} from "@/lib/validation/prompt";
import { ToolTaskGroup } from "./tool-task-group";

// Module-level set to track sessions that have sent initial prompt
// This persists across React Strict Mode double-mounts
const sentInitialPrompts = new Set<string>();

interface ChatPanelProps {
  sessionId: string;
  isReady: boolean;
  initialMessages?: UIMessage[];
  initialPrompt?: string | null;
  onToolExecuted?: () => void;
  onStatusChange?: (status: string) => void;
}

export function ChatPanel({
  sessionId,
  isReady,
  initialMessages = [],
  initialPrompt,
  onToolExecuted,
  onStatusChange,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPromptLimitModal, setShowPromptLimitModal] = useState(false);

  // Memoize transport to prevent recreating on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { sessionId },
      }),
    [sessionId],
  );

  // Initialize useChat with optional messages from database
  const { messages, sendMessage, status, regenerate } = useChat({
    transport,
    messages: initialMessages,
  });

  // Send initial prompt if provided (new app flow)
  // This triggers the LLM to respond to the user's first message
  useEffect(() => {
    if (
      initialPrompt &&
      isReady &&
      status === "ready" &&
      !sentInitialPrompts.has(sessionId)
    ) {
      const nextValidationError = validatePrompt(initialPrompt);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      sentInitialPrompts.add(sessionId);
      setValidationError(null);
      sendMessage({ text: initialPrompt });
    }
  }, [initialPrompt, isReady, status, sessionId, sendMessage]);

  // Notify parent of status changes
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Track tool results to trigger refresh when files are written
  const seenToolResultsRef = useRef(new Set<string>());
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Pre-populate seen tool results from initial messages to avoid false refreshes
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

    for (const message of messages) {
      if (message.parts) {
        for (const part of message.parts) {
          const p = part as Record<string, unknown>;
          const type = p.type as string;
          const state = p.state as string;
          const toolCallId = p.toolCallId as string;

          // Check for completed tool calls (type: "tool-writeFile", state: "output-available")
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
      // Clear any existing timer to debounce multiple rapid tool completions
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // Wait for Next.js to pick up file changes
      refreshTimerRef.current = setTimeout(() => {
        onToolExecuted?.();
        refreshTimerRef.current = null;
      }, 1000);
    }
  }, [messages, onToolExecuted]);

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

      setValidationError(null);
      sendMessage({ text: text.trim() });
      setInput("");
    },
    [isReady, sendMessage],
  );

  const renderMessageParts = (
    parts: Array<{ type: string; [key: string]: unknown }>,
    messageId: string,
  ) => {
    const elements: React.ReactNode[] = [];
    let toolParts: Array<Record<string, unknown>> = [];

    const flushToolParts = () => {
      if (toolParts.length > 0) {
        elements.push(
          <ToolTaskGroup
            key={`${messageId}-tools-${elements.length}`}
            tools={toolParts}
          />,
        );
        toolParts = [];
      }
    };

    parts.forEach((part) => {
      if (part.type === "text") {
        flushToolParts();
        elements.push(
          <MessageResponse
            key={`${messageId}-text-${elements.length}`}
            className="prose prose-invert prose-sm max-w-none prose-pre:bg-card prose-pre:border prose-pre:border-border prose-code:text-foreground"
          >
            {part.text as string}
          </MessageResponse>,
        );
      } else if (part.type.startsWith("tool-")) {
        toolParts.push(part);
      }
    });

    flushToolParts();
    return elements;
  };

  return (
    <div className="flex h-full flex-col bg-background font-mono overflow-hidden">
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="gap-4 p-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<SparklesIcon className="size-10 text-primary " />}
              title="READY TO BUILD"
              description="Describe your quest. Code runs in an isolated sandbox."
              className="text-foreground [&_h3]:font-mono [&_h3]:text-sm [&_p]:text-muted-foreground [&_p]:font-mono"
            />
          ) : (
            messages.map((message, messageIndex) => (
              <Fragment key={message.id}>
                <Message from={message.role} className="max-w-full">
                  <MessageContent
                    className={cn(
                      "border rounded-lg shadow-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-card-foreground border-border",
                    )}
                  >
                    {message.parts &&
                      renderMessageParts(
                        message.parts as Array<{
                          type: string;
                          [key: string]: unknown;
                        }>,
                        message.id,
                      )}
                  </MessageContent>
                </Message>
                {message.role === "assistant" &&
                  messageIndex === messages.length - 1 && (
                    <MessageActions className="ml-0">
                      <MessageAction
                        onClick={() => regenerate()}
                        tooltip="Retry"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-border"
                      >
                        <RefreshCcwIcon className="size-3" />
                      </MessageAction>
                      <MessageAction
                        onClick={() => {
                          const lastText = message.parts?.find(
                            (p) => p.type === "text",
                          );
                          if (lastText && "text" in lastText) {
                            navigator.clipboard.writeText(
                              lastText.text as string,
                            );
                          }
                        }}
                        tooltip="Copy"
                        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-border"
                      >
                        <CopyIcon className="size-3" />
                      </MessageAction>
                    </MessageActions>
                  )}
              </Fragment>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton className="border-4 border-border bg-card text-foreground hover:bg-accent" />
      </Conversation>

      {/* Prompt Input Area */}
      <div className="relative flex-shrink-0 border-t-4 border-border p-4">
        <div className="border border-border bg-card rounded-lg shadow-sm p-4">
          <PromptInput
            onSubmit={handleSubmit}
            className="[&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-transparent [&_[data-slot=input-group]]:shadow-none"
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
                isReady ? "> Enter command..." : "> Initializing sandbox..."
              }
              disabled={!isReady}
              className="min-h-[60px] border-0 bg-transparent text-foreground font-mono placeholder-muted-foreground focus-visible:ring-0"
            />
            <PromptInputFooter className="bg-transparent px-3 py-2">
              <div className="flex items-center gap-2">
                {!isReady && (
                  <span className="font-mono text-[8px] text-muted-foreground ">
                    LOADING
                  </span>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">
                  {input.length}/{PROMPT_MAX_LENGTH}
                </span>
              </div>
              <PromptInputSubmit
                status={status}
                disabled={!input.trim() || !isReady}
                className="bg-primary text-primary-foreground hover:bg-primary/80 border-2 border-primary "
              />
            </PromptInputFooter>
          </PromptInput>
          {validationError ? (
            <p className="px-3 pt-2 font-mono text-[10px] text-destructive">
              {validationError}
            </p>
          ) : null}
          <PromptLimitModal
            open={showPromptLimitModal}
            onOpenChange={setShowPromptLimitModal}
          />
        </div>
      </div>
    </div>
  );
}
