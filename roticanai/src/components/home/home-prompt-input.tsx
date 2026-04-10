import {
  CompassIcon,
  Loader2Icon,
  MessageSquareIcon,
  WrenchIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { ChangeEvent, ClipboardEvent } from "react";
import { useState } from "react";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { PromptLimitModal } from "@/components/prompt-limit-modal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DailyUsageIndicator } from "@/features/apps/components/daily-usage-indicator";
import { ChatSuggestions } from "@/features/home/components/chat-suggestions";
import type { HomeMode } from "@/features/home/types";
import { HomeIdeaWizard } from "@/features/idea-wizard/components/home-idea-wizard";
import {
  PROMPT_MAX_LENGTH,
  wouldExceedPromptLimit,
} from "@/lib/validation/prompt";

const IdeaSuggestions = dynamic(
  () =>
    import("@/components/idea-suggestions").then((mod) => mod.IdeaSuggestions),
  { ssr: false },
);

function MobileAwareSuggestions({
  show,
  onSelect,
  disabled,
}: {
  show: boolean;
  onSelect: (idea: string) => void;
  disabled?: boolean;
}) {
  const { textInput } = usePromptInputController();
  const hasInput = textInput.value.trim().length > 0;

  if (!show || hasInput) return null;

  return <IdeaSuggestions onSelect={onSelect} disabled={disabled} />;
}

function PromptCharacterCount() {
  const { textInput } = usePromptInputController();
  const characterCount = textInput.value.length;
  const isNearLimit = characterCount >= PROMPT_MAX_LENGTH * 0.9;

  return (
    <span
      className={`font-mono text-xs ${
        isNearLimit ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {characterCount}/{PROMPT_MAX_LENGTH}
    </span>
  );
}

interface HomePromptInputProps {
  initialPrompt?: string | null;
  isRemixing: boolean;
  isCreating: boolean;
  isAuthenticated: boolean;
  mode?: HomeMode;
  onModeChange?: (mode: HomeMode) => void;
  error?: string | null;
  onInputChange?: (text: string) => void;
  onSubmit: (params: { text: string }) => void | Promise<void>;
}

export function HomePromptInput({
  initialPrompt,
  isRemixing,
  isCreating,
  isAuthenticated,
  mode = "build",
  onModeChange,
  error,
  onInputChange,
  onSubmit,
}: HomePromptInputProps) {
  const t = useTranslations("home");
  const [showIdeaWizard, setShowIdeaWizard] = useState(false);
  const [showPromptLimitModal, setShowPromptLimitModal] = useState(false);

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onInputChange?.(event.target.value);
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
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
  };

  return (
    <PromptInputProvider initialInput={initialPrompt ?? ""}>
      {/* Mode toggle */}
      <div
        data-tour-id="home-tour-mode-toggle"
        className="relative z-20 w-full flex justify-center px-3 pb-2 md:pb-3 md:max-w-2xl md:mx-auto md:px-0"
      >
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value && (value === "build" || value === "chat")) {
              onModeChange?.(value as HomeMode);
            }
          }}
          variant="outline"
          size="sm"
          spacing={0}
          className="font-mono text-xs"
        >
          <ToggleGroupItem value="build" className="gap-1.5">
            <WrenchIcon className="size-3" />
            <span>{t("mode.build")}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="chat" className="gap-1.5">
            <MessageSquareIcon className="size-3" />
            <span>{t("mode.chat")}</span>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Prompt input */}
      <div
        data-tour-id={
          mode === "build" ? "home-tour-build-prompt" : "home-tour-chat-prompt"
        }
        className="relative z-20 w-full flex flex-col items-center px-3 pb-2 md:pb-6 md:max-w-2xl md:mx-auto md:px-0"
      >
        <div className="relative z-30 w-full border border-border bg-background rounded-lg overflow-hidden">
          <PromptInput
            onSubmit={onSubmit}
            className="w-full flex items-end [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:shadow-none [&_[data-slot=input-group]]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:ring-0 [&_[data-slot=input-group]]:has-[[data-slot=input-group-control]:focus-visible]:border-0"
          >
            <PromptInputTextarea
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder={
                mode === "chat"
                  ? t("chat.placeholder")
                  : isRemixing
                    ? t("placeholderRemix")
                    : t("placeholder")
              }
              className="min-h-[72px] md:min-h-32 bg-transparent text-foreground font-mono border-none focus:ring-0 text-base py-3 md:py-4 pr-14 resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              disabled={isCreating}
              rows={3}
            />
            <PromptInputFooter className="items-center">
              <div className="flex flex-wrap items-center gap-2">
                {mode === "build" && !isRemixing ? (
                  <button
                    type="button"
                    data-tour-id="home-tour-idea-wizard"
                    onClick={() => setShowIdeaWizard(true)}
                    disabled={isCreating}
                    className="inline-flex items-center gap-1.5 px-3 py-2 font-mono text-sm text-muted-foreground border border-border rounded-md hover:text-foreground hover:border-foreground transition-colors disabled:opacity-50"
                  >
                    <CompassIcon className="size-3" />
                    <span>{t("ideaWizard.cta")}</span>
                  </button>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <PromptCharacterCount />
                <PromptInputSubmit
                  className="shrink-0 size-10 rounded-lg bg-foreground text-background border border-border"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <Loader2Icon className="size-5 animate-spin" />
                  ) : (
                    <>
                      <svg
                        width={9}
                        height={15}
                        viewBox="0 0 9 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        role="img"
                        aria-label="Submit"
                      >
                        <path
                          d="M6 12V9H3V12H6ZM0 12V15H3V12H0ZM3 6H6V3H3V6ZM9 6H6V9H9V6ZM3 3V0H0V3H3Z"
                          fill="currentColor"
                        />
                      </svg>
                      <span className="sr-only">{t("start")}</span>
                    </>
                  )}
                </PromptInputSubmit>
              </div>
            </PromptInputFooter>
          </PromptInput>
        </div>
        {error ? (
          <p className="w-full pt-2 font-mono text-xs text-destructive">
            {error}
          </p>
        ) : null}
        <PromptLimitModal
          open={showPromptLimitModal}
          onOpenChange={setShowPromptLimitModal}
        />
        {mode === "build" && (
          <HomeIdeaWizard
            open={showIdeaWizard}
            onOpenChange={setShowIdeaWizard}
            disabled={isCreating}
            onSubmit={onSubmit}
          />
        )}
        {isAuthenticated && (
          <div className="pt-2 md:pt-4">
            <DailyUsageIndicator />
          </div>
        )}
      </div>
      {mode === "build" && (
        <div
          data-tour-id="home-tour-build-suggestions"
          className="w-full flex justify-center px-4 pt-2 pb-2 md:pt-4 md:pb-8"
        >
          <div className="w-full md:max-w-2xl">
            <MobileAwareSuggestions
              show={!isRemixing}
              onSelect={(idea) => onSubmit({ text: idea })}
              disabled={isCreating}
            />
          </div>
        </div>
      )}
      {mode === "chat" && (
        <div
          data-tour-id="home-tour-chat-suggestions"
          className="w-full flex justify-center px-4 pt-2 pb-2 md:pt-4 md:pb-8"
        >
          <div className="w-full md:max-w-2xl">
            <ChatSuggestions
              onSelect={(text) => onSubmit({ text })}
              disabled={isCreating}
            />
          </div>
        </div>
      )}
    </PromptInputProvider>
  );
}
