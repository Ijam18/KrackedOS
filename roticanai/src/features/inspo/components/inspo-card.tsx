"use client";

import {
  GamepadIcon,
  ImageIcon,
  PaletteIcon,
  SparklesIcon,
  TargetIcon,
  WrenchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import type { Inspo } from "@/db/schema";
import { cn } from "@/lib/ui/utils";

const INSPO_CATEGORIES = [
  "games",
  "productivity",
  "utilities",
  "creative",
] as const;

type InspoCategory = (typeof INSPO_CATEGORIES)[number];

interface InspoCardProps {
  inspo: Inspo;
}

const CATEGORY_CONFIG: Record<
  InspoCategory,
  { label: string; icon: ReactNode; bgColor: string; textColor: string }
> = {
  games: {
    label: "Games",
    icon: <GamepadIcon className="size-3" />,
    bgColor: "bg-purple-500/20",
    textColor: "text-purple-400",
  },
  productivity: {
    label: "Productivity",
    icon: <TargetIcon className="size-3" />,
    bgColor: "bg-blue-500/20",
    textColor: "text-blue-400",
  },
  utilities: {
    label: "Tools",
    icon: <WrenchIcon className="size-3" />,
    bgColor: "bg-green-500/20",
    textColor: "text-green-400",
  },
  creative: {
    label: "Creative",
    icon: <PaletteIcon className="size-3" />,
    bgColor: "bg-pink-500/20",
    textColor: "text-pink-400",
  },
};

const isValidCategory = (value: string): value is InspoCategory =>
  INSPO_CATEGORIES.includes(value as InspoCategory);

export function InspoCard({ inspo }: InspoCardProps) {
  const t = useTranslations("inspo");
  const config = isValidCategory(inspo.category)
    ? CATEGORY_CONFIG[inspo.category]
    : null;

  return (
    <Link
      href={`/?inspo=${inspo.id}`}
      className="group block active:scale-[0.98] transition-transform"
    >
      <div className="relative overflow-hidden border-2 border-border bg-card rounded-lg transition-all hover:border-primary shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
        {/* Thumbnail preview */}
        <div className="aspect-[4/3] w-full overflow-hidden border-b-2 border-border bg-muted/30">
          {inspo.thumbnailUrl ? (
            <Image
              src={inspo.thumbnailUrl}
              alt={inspo.title}
              width={400}
              height={300}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
              <ImageIcon className="size-8 text-muted-foreground/30" />
            </div>
          )}

          {/* Category badge - floating */}
          {config && (
            <div
              className={cn(
                "absolute top-2 left-2 flex items-center gap-1 px-2 py-1 text-[10px] font-mono border rounded-md",
                config.bgColor,
                config.textColor,
                "border-current/30",
              )}
            >
              {config.icon}
              <span className="hidden sm:inline">{config.label}</span>
            </div>
          )}

          {/* Remix overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-mono text-xs border-2 border-primary-foreground/20 rounded-lg">
              <SparklesIcon className="size-4" />
              <span>{t("remix")}</span>
            </div>
          </div>
        </div>

        {/* Card content */}
        <div className="p-3">
          <h3 className="font-mono text-[10px] sm:text-xs text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {inspo.title.toUpperCase()}
          </h3>
          <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground line-clamp-2 font-mono leading-relaxed">
            {inspo.description}
          </p>
        </div>
      </div>
    </Link>
  );
}
