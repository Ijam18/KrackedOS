"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LimitReachedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resetsAt: string;
}

export function LimitReachedModal({
  open,
  onOpenChange,
  resetsAt,
}: LimitReachedModalProps) {
  const t = useTranslations("usage");
  const resetDate = new Date(resetsAt);
  const formattedTime = resetDate.toLocaleTimeString("en-MY", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-mono text-lg text-primary">
            {t("limitReachedTitle")}
          </DialogTitle>
          <DialogDescription className="text-center font-mono text-sm text-muted-foreground">
            {t("limitReachedDescription")}
            <br />
            {t("resetsAt", { time: formattedTime })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center py-4">
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
            className="px-8"
          >
            <span className="font-mono">{t("gotIt")}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
