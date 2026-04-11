"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  CopyIcon,
  RefreshCcwIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
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
import { Shimmer } from "@/components/ai-elements/shimmer";
import { PromptLimitModal } from "@/components/prompt-limit-modal";
import { cn } from "@/lib/ui/utils";
import {
  validatePrompt,
  wouldExceedPromptLimit,
} from "@/lib/validation/prompt";

interface HomeChatProps {
  initialMessage?: string | null;
  onSwitchToBuild?: () => void;
}

export function HomeChat({ initialMessage, onSwitchToBuild }: HomeChatProps) {
  const t = useTranslations("home");
  const [input, setInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPromptLimitModal, setShowPromptLimitModal] = useState(false);

  // Memoize transport to prevent recreating on every render
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat/ephemeral",
      }),
    [],
  );

  // Initialize useChat for ephemeral conversation
  const { messages, sendMessage, status, regenerate } = useChat({
    transport,
  });

  // Send initial message if provided
  const hasSentInitialRef = useRef(false);

  useEffect(() => {
    if (
      initialMessage &&
      !hasSentInitialRef.current &&
      messages.length === 0 &&
      status === "ready"
    ) {
      const nextValidationError = validatePrompt(initialMessage);
      if (!nextValidationError) {
        hasSentInitialRef.current = true;
        sendMessage({ text: initialMessage });
      }
    }
  }, [initialMessage, messages.length, status, sendMessage]);

  const handleSubmit = useCallback(
    ({ text }: { text: string }) => {
      const nextValidationError = validatePrompt(text);
      if (nextValidationError) {
        setValidationError(nextValidationError);
        return;
      }

      setValidationError(null);
      sendMessage({ text: text.trim() });
      setInput("");
    },
    [sendMessage],
  );

  const isStreaming = status === "streaming";
  const isLoading = status === "streaming" || status === "submitted";

  return (
    <div className="flex h-full flex-col bg-background font-mono overflow-hidden">
      <div className="flex-1 min-h-0 max-w-3xl mx-auto w-full">
        <Conversation className="h-full">
          <ConversationContent className="gap-4 p-4">
            {messages.length === 0 ? (
              <ConversationEmptyState
                icon={<SparklesIcon className="size-10 text-primary" />}
                title={t("chat.emptyTitle")}
                description={t("chat.emptyDescription")}
                className="text-foreground [&_h3]:font-mono [&_h3]:text-sm [&_p]:text-muted-foreground [&_p]:font-mono"
              />
            ) : (
              <>
                {messages.map((message, messageIndex) => {
                  const isLastMessage = messageIndex === messages.length - 1;
                  const isLoadingMessage =
                    isLastMessage &&
                    message.role === "assistant" &&
                    isLoading &&
                    (!message.parts ||
                      message.parts.length === 0 ||
                      !message.parts.some((p) => p.type === "text" && p.text));

                  return (
                    <Fragment key={message.id}>
                      <Message from={message.role} className="max-w-full">
                        <MessageContent
                          className={cn(
                            "border rounded-lg shadow-sm",
                            message.role === "user"
                              ? "bg-primary text-background border-primary"
                              : "bg-card text-card-foreground border-border",
                          )}
                        >
                          {isLoadingMessage ? (
                            <Shimmer className="text-sm">
                              {t("chat.thinking")}
                            </Shimmer>
                          ) : (
                            message.parts?.map((part, partIndex) => {
                              if (part.type === "text") {
                                return (
                                  <MessageResponse
                                    key={`${message.id}-${partIndex}`}
                                    className={cn(
                                      "prose prose-sm max-w-none",
                                      message.role === "user"
                                        ? "[&_*]:text-[var(--background)]"
                                        : "prose-invert prose-pre:bg-card prose-pre:border prose-pre:border-border prose-code:text-foreground",
                                    )}
                                  >
                                    {part.text}
                                  </MessageResponse>
                                );
                              }
                              return null;
                            })
                          )}
                        </MessageContent>
                      </Message>
                      {message.role === "assistant" &&
                        messageIndex === messages.length - 1 &&
                        !isLoadingMessage && (
                          <MessageActions className="ml-0">
                            <MessageAction
                              onClick={() => regenerate()}
                              tooltip={t("chat.retry")}
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
                              tooltip={t("chat.copy")}
                              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground border-2 border-border"
                            >
                              <CopyIcon className="size-3" />
                            </MessageAction>
                          </MessageActions>
                        )}
                    </Fragment>
                  );
                })}
                {/* Show loading placeholder when waiting for assistant response */}
                {isLoading &&
                  messages[messages.length - 1]?.role === "user" && (
                    <Message from="assistant" className="max-w-full">
                      <MessageContent className="border rounded-lg shadow-sm bg-card text-card-foreground border-border">
                        <Shimmer className="text-sm">
                          {t("chat.thinking")}
                        </Shimmer>
                      </MessageContent>
                    </Message>
                  )}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton className="border-4 border-border bg-card text-foreground hover:bg-accent" />
        </Conversation>
      </div>

      {/* Prompt Input Area */}
      <div className="relative flex-shrink-0 p-4">
        <div className="max-w-3xl mx-auto w-full">
          <div className="relative z-30 w-full border border-border bg-background rounded-lg overflow-hidden">
            <PromptInput
              onSubmit={handleSubmit}
              className="w-full flex items-end [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-0"
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
                placeholder={t("chat.placeholder")}
                disabled={isStreaming}
                rows={2}
                className="min-h-24 bg-transparent text-foreground font-mono border-none focus:ring-0 text-base py-3 pr-14 resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              />
              <PromptInputFooter className="items-center">
                <div className="flex flex-wrap items-center gap-2">
                  {onSwitchToBuild && (
                    <button
                      type="button"
                      onClick={onSwitchToBuild}
                      className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-xs text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-foreground transition-colors"
                    >
                      <WrenchIcon className="size-3" />
                      <span>{t("chat.switchToBuild")}</span>
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <PromptInputSubmit
                    status={status}
                    disabled={!input.trim() || isStreaming}
                    className="shrink-0 size-10 rounded-lg bg-foreground text-background border border-border"
                  />
                </div>
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
    </div>
  );
}
