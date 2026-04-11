import type { UIMessage } from "ai";

export const PROMPT_MAX_LENGTH = 1000;

export function validatePrompt(text: string): string | null {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return "Prompt is required";
  }

  if (text.length > PROMPT_MAX_LENGTH) {
    return `Prompt must be ${PROMPT_MAX_LENGTH} characters or less`;
  }

  return null;
}

export function wouldExceedPromptLimit({
  currentText,
  selectionStart,
  selectionEnd,
  pastedText,
}: {
  currentText: string;
  selectionStart: number;
  selectionEnd: number;
  pastedText: string;
}) {
  const nextText =
    currentText.slice(0, selectionStart) +
    pastedText +
    currentText.slice(selectionEnd);

  return nextText.length > PROMPT_MAX_LENGTH;
}

export function getTextFromMessage(
  message: UIMessage | undefined,
): string | null {
  if (!message?.parts) {
    return null;
  }

  for (const part of message.parts) {
    if (part.type === "text") {
      return part.text;
    }
  }

  return null;
}
