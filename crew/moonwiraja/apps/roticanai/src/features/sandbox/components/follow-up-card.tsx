"use client";

import {
  CheckIcon,
  ChevronRightIcon,
  MessageCircleQuestionIcon,
  SendIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui/utils";
import { PROMPT_MAX_LENGTH } from "@/lib/validation/prompt";

export interface FollowUpQuestion {
  question: string;
  header: string;
  options: { label: string; description: string }[];
  multiple?: boolean;
}

interface FollowUpCardProps {
  questions: FollowUpQuestion[];
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}

/** Answer for a single step — either selected option labels or custom text */
interface StepAnswer {
  labels: string[];
  isCustom: boolean;
}

/**
 * Renders follow-up questions as a step-by-step wizard.
 * Only the active step is interactive — completed steps show a locked-in summary.
 * Once all steps are answered, all answers are combined into one message.
 */
export function FollowUpCard({
  questions,
  onAnswer,
  disabled = false,
}: FollowUpCardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, StepAnswer>>({});
  const [multiSelections, setMultiSelections] = useState<Set<string>>(
    new Set(),
  );
  const [customText, setCustomText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const activeStepRef = useRef<HTMLDivElement>(null);

  const totalSteps = questions.length;
  const allAnswered = Object.keys(answers).length === totalSteps;

  // When all steps are answered, combine and submit
  useEffect(() => {
    if (allAnswered && !submitted) {
      setSubmitted(true);
      const combined = questions
        .map((q, i) => {
          const answer = answers[i];
          const answerText = answer.labels.join(", ");
          if (totalSteps === 1) return answerText;
          return `${q.header}: ${answerText}`;
        })
        .join("\n");
      onAnswer(combined);
    }
  }, [allAnswered, submitted, answers, questions, totalSteps, onAnswer]);

  // Scroll the active step into view when it changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: activeStep triggers re-assignment of activeStepRef.current
  useEffect(() => {
    if (activeStepRef.current) {
      activeStepRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [activeStep]);

  const lockInAnswer = useCallback(
    (stepIndex: number, answer: StepAnswer) => {
      setAnswers((prev) => ({ ...prev, [stepIndex]: answer }));
      setCustomText("");
      setMultiSelections(new Set());
      if (stepIndex < totalSteps - 1) {
        setActiveStep(stepIndex + 1);
      }
    },
    [totalSteps],
  );

  const handleOptionClick = useCallback(
    (label: string, isMultiple: boolean) => {
      if (disabled || submitted) return;

      if (isMultiple) {
        setMultiSelections((prev) => {
          const next = new Set(prev);
          if (next.has(label)) {
            next.delete(label);
          } else {
            next.add(label);
          }
          return next;
        });
      } else {
        // Single-select: lock in immediately and advance
        lockInAnswer(activeStep, { labels: [label], isCustom: false });
      }
    },
    [disabled, submitted, activeStep, lockInAnswer],
  );

  const handleMultiConfirm = useCallback(() => {
    if (disabled || submitted || multiSelections.size === 0) return;
    lockInAnswer(activeStep, {
      labels: Array.from(multiSelections),
      isCustom: false,
    });
  }, [disabled, submitted, multiSelections, activeStep, lockInAnswer]);

  const handleCustomSubmit = useCallback(() => {
    if (disabled || submitted || !customText.trim()) return;
    lockInAnswer(activeStep, {
      labels: [customText.trim()],
      isCustom: true,
    });
  }, [disabled, submitted, customText, activeStep, lockInAnswer]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleCustomSubmit();
      }
    },
    [handleCustomSubmit],
  );

  return (
    <div className="space-y-3">
      {/* Step counter */}
      {totalSteps > 1 && (
        <div className="flex items-center gap-2 px-1">
          {questions.map((_, i) => (
            <div
              key={`step-dot-${questions[i].header}`}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all",
                i < activeStep && "bg-primary",
                i === activeStep && !allAnswered && "bg-primary/50",
                i > activeStep && !allAnswered && "bg-border",
                allAnswered && "bg-primary",
              )}
            />
          ))}
        </div>
      )}

      {questions.map((q, qIndex) => {
        const answer = answers[qIndex];
        const isActive = qIndex === activeStep && !allAnswered;
        const isCompleted = answer != null;
        const isFuture = qIndex > activeStep && !allAnswered;

        return (
          <div
            key={`question-${qIndex}-${q.header}`}
            ref={isActive ? activeStepRef : undefined}
            className={cn(
              "border border-border rounded-xl overflow-hidden transition-all",
              isActive && "border-primary/50 bg-card",
              isCompleted && "border-border bg-card/50",
              isFuture && "border-border/30 bg-card/30 opacity-40",
            )}
          >
            {/* Question header */}
            <div
              className={cn(
                "flex items-center gap-2 p-3 border-b border-border",
                isActive && "bg-primary/5",
                isCompleted && "bg-transparent",
              )}
            >
              {isCompleted ? (
                <div className="size-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full flex-shrink-0">
                  <CheckIcon className="size-2.5" />
                </div>
              ) : (
                <MessageCircleQuestionIcon
                  className={cn(
                    "size-4 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
              )}
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {q.header}
              </span>
              {totalSteps > 1 && (
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {qIndex + 1}/{totalSteps}
                </span>
              )}
            </div>

            {/* Completed: show selected answer summary */}
            {isCompleted && (
              <div className="flex items-center gap-2 px-3 py-2.5">
                <ChevronRightIcon className="size-3 text-primary flex-shrink-0" />
                <span className="text-xs text-foreground">
                  {answer.labels.join(", ")}
                </span>
              </div>
            )}

            {/* Active: show question + options */}
            {isActive && (
              <>
                <div className="p-3 pb-2">
                  <p className="text-sm text-foreground leading-relaxed">
                    {q.question}
                  </p>
                </div>

                <div className="px-3 pb-3 space-y-2">
                  {q.options.map((option, oIndex) => {
                    const isSelected = multiSelections.has(option.label);

                    return (
                      <button
                        key={`option-${oIndex}-${option.label}`}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          handleOptionClick(option.label, !!q.multiple)
                        }
                        className={cn(
                          "w-full text-left p-3 border rounded-lg transition-all",
                          "hover:border-primary hover:bg-primary/5",
                          "",
                          isSelected && "border-primary bg-primary/10",
                          !isSelected && "border-border bg-background/50",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5">
                            {isSelected ? (
                              <div className="size-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full">
                                <CheckIcon className="size-2.5" />
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  "size-4 border border-muted-foreground",
                                  q.multiple ? "rounded-sm" : "rounded-full",
                                )}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-medium block text-foreground/80">
                              {option.label}
                            </span>
                            {option.description && (
                              <span className="text-[11px] text-muted-foreground block mt-0.5">
                                {option.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Multi-select confirm */}
                  {q.multiple && (
                    <button
                      type="button"
                      disabled={disabled || multiSelections.size === 0}
                      onClick={handleMultiConfirm}
                      className={cn(
                        "w-full p-2 border border-primary bg-primary text-primary-foreground rounded-lg",
                        "text-xs font-medium",
                        "transition-all",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                      )}
                    >
                      Confirm Selection
                    </button>
                  )}
                </div>

                {/* Custom text input */}
                <div className="mx-3 mb-3 border border-border rounded-lg bg-background/50 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      Or type your own answer
                    </span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {customText.length}/{PROMPT_MAX_LENGTH}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <input
                      maxLength={PROMPT_MAX_LENGTH}
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={disabled}
                      placeholder="Type here..."
                      className={cn(
                        "flex-1 bg-transparent px-3 py-2.5 text-xs text-foreground",
                        "placeholder-muted-foreground",
                        "focus:outline-none",
                      )}
                    />
                    <button
                      type="button"
                      disabled={disabled || !customText.trim()}
                      onClick={handleCustomSubmit}
                      className={cn(
                        "px-3 py-2.5 text-primary hover:text-primary/80 transition-colors",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                      )}
                      aria-label="Send custom answer"
                    >
                      <SendIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Future: just show header, nothing else */}
          </div>
        );
      })}

      {/* All answered confirmation */}
      {allAnswered && (
        <div className="flex items-center gap-2 px-1 py-1">
          <CheckIcon className="size-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-primary">All answered</span>
        </div>
      )}
    </div>
  );
}
