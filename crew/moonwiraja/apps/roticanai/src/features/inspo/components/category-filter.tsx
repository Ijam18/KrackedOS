"use client";

import {
  GamepadIcon,
  LayoutGridIcon,
  PaletteIcon,
  TargetIcon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/ui/utils";

const INSPO_CATEGORIES = [
  "games",
  "productivity",
  "utilities",
  "creative",
] as const;

type InspoCategory = (typeof INSPO_CATEGORIES)[number];

const CATEGORY_CONFIG: Record<
  InspoCategory | "all",
  { label: string; icon: ReactNode; color: string }
> = {
  all: {
    label: "All",
    icon: <LayoutGridIcon className="size-4" />,
    color: "text-foreground",
  },
  games: {
    label: "Games",
    icon: <GamepadIcon className="size-4" />,
    color: "text-purple-400",
  },
  productivity: {
    label: "Productivity",
    icon: <TargetIcon className="size-4" />,
    color: "text-blue-400",
  },
  utilities: {
    label: "Tools",
    icon: <WrenchIcon className="size-4" />,
    color: "text-green-400",
  },
  creative: {
    label: "Creative",
    icon: <PaletteIcon className="size-4" />,
    color: "text-pink-400",
  },
};

export function CategoryFilter() {
  const t = useTranslations("inspo.categories");
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "all";

  const categories = ["all", ...INSPO_CATEGORIES] as const;

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
      {categories.map((category) => {
        const isActive = category === currentCategory;
        const config = CATEGORY_CONFIG[category];
        const href =
          category === "all" ? "/inspo" : `/inspo?category=${category}`;

        return (
          <Link
            key={category}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 font-mono text-xs whitespace-nowrap transition-all flex-shrink-0",
              "border-2 rounded-lg",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary",
            )}
          >
            <span
              className={cn(
                isActive ? "text-primary-foreground" : config.color,
              )}
            >
              {config.icon}
            </span>
            <span>{t(category)}</span>
          </Link>
        );
      })}
    </div>
  );
}
