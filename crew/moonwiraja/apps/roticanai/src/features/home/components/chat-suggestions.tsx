"use client";

import { useTranslations } from "next-intl";

const CHAT_SUGGESTION_KEYS = ["0", "1", "2"] as const;

interface ChatSuggestionsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function ChatSuggestions({ onSelect, disabled }: ChatSuggestionsProps) {
  const t = useTranslations("home");

  return (
    <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible md:flex-wrap md:justify-center pb-2 scrollbar-hide">
      {CHAT_SUGGESTION_KEYS.map((key, i) => {
        const text = t(`chat.suggestions.${key}`);
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(text)}
            disabled={disabled}
            className="px-3 py-2 text-sm font-mono text-muted-foreground border border-muted-foreground/30 rounded-lg hover:border-primary hover:text-primary transition-all disabled:opacity-50 shrink-0 whitespace-nowrap animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
