"use client";

import { MessageSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDailyUsageQuery } from "@/features/apps/hooks/queries";
import { cn } from "@/lib/ui/utils";

interface DailyUsageIndicatorProps {
  className?: string;
  showIcon?: boolean;
  variant?: "default" | "compact";
}

export function DailyUsageIndicator({
  className,
  showIcon = true,
  variant = "default",
}: DailyUsageIndicatorProps) {
  const t = useTranslations("usage");
  const { data: usage, isLoading } = useDailyUsageQuery();

  if (isLoading || !usage) {
    return null;
  }

  const isLow = usage.remaining <= 3;
  const isExhausted = usage.remaining === 0;

  // Format reset time
  const resetsAt = new Date(usage.resetsAt);
  const hoursUntilReset = Math.max(
    0,
    Math.ceil((resetsAt.getTime() - Date.now()) / (1000 * 60 * 60)),
  );

  const content = (
    <div
      className={cn(
        "flex items-center gap-1.5 font-mono text-sm transition-colors cursor-default",
        isExhausted
          ? "text-destructive"
          : isLow
            ? "text-yellow-500"
            : "text-muted-foreground",
        className,
      )}
    >
      {showIcon && <MessageSquareIcon className="size-4" />}
      <span>
        {isExhausted
          ? t("limitReached", { hours: hoursUntilReset })
          : variant === "compact"
            ? t("messagesCompact", {
                remaining: usage.remaining,
                limit: usage.limit,
              })
            : t("messagesAvailable", { remaining: usage.remaining })}
      </span>
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="top">
          <span className="font-mono text-xs">
            {t("resetsIn", { hours: hoursUntilReset })}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
