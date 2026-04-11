"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PROMPT_MAX_LENGTH } from "@/lib/validation/prompt";

type PromptLimitModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PromptLimitModal({
  open,
  onOpenChange,
}: PromptLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-mono text-lg">
            Prompt too long
          </DialogTitle>
          <DialogDescription className="font-mono text-sm">
            This prompt goes over the {PROMPT_MAX_LENGTH}-character limit.
            Shorten it a bit, then try pasting again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button className="font-mono" onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
