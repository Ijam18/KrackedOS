import { Effect } from "effect";
import { PlusIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { CategoryFilter } from "@/features/inspo/components/category-filter";
import { InspoCard } from "@/features/inspo/components/inspo-card";
import {
  getInspos,
  type InspoCategory,
  isValidCategory,
} from "@/lib/services/inspo";

interface InspoPageProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function InspoPage({ searchParams }: InspoPageProps) {
  const { category } = await searchParams;

  // Validate and parse category
  const validCategory: InspoCategory | undefined =
    category && isValidCategory(category) ? category : undefined;

  // Fetch inspos (using Effect.runPromise for server component)
  const inspos = await Effect.runPromise(getInspos(validCategory));

  const t = await getTranslations("inspo");

  return (
    <div className="min-h-full bg-background flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-border bg-card/50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="font-mono text-sm sm:text-base text-primary ">
                {t("title")}
              </h1>
              <p className="mt-1 font-mono text-[10px] sm:text-xs text-muted-foreground">
                {inspos.length} {t("examples", { count: inspos.length })}
                {validCategory
                  ? ` ${t("inCategory", { category: validCategory })}`
                  : ` ${t("toRemix")}`}
              </p>
            </div>
          </div>

          {/* Category filter */}
          <Suspense
            fallback={<div className="h-10 bg-muted/20 animate-pulse" />}
          >
            <CategoryFilter />
          </Suspense>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 mx-auto max-w-6xl w-full px-4 py-4 sm:py-6">
        {inspos.length === 0 ? (
          <EmptyState category={validCategory} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {inspos.map((inspo) => (
              <InspoCard key={inspo.id} inspo={inspo} />
            ))}
          </div>
        )}
      </main>

      {/* Fixed bottom CTA on mobile */}
      <div className="sticky bottom-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent sm:relative sm:bg-none sm:py-6 sm:flex sm:justify-center border-t border-border/50 sm:border-0">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-mono text-xs border-4 border-primary rounded-lg hover:bg-primary/90 transition-all active:scale-95 "
        >
          <PlusIcon className="size-4" />
          <span>{t("startFromScratch")}</span>
        </Link>
      </div>
    </div>
  );
}

async function EmptyState({ category }: { category?: InspoCategory }) {
  const t = await getTranslations("inspo");
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center">
      <div className="border border-border bg-card rounded-lg shadow-sm p-4 p-6 sm:p-8">
        <SparklesIcon className="mx-auto size-10 sm:size-12 text-primary " />
        <h2 className="mt-4 font-mono text-sm sm:text-lg text-foreground">
          {category ? t("emptyTitle") : t("comingSoonTitle")}
        </h2>
        <p className="mt-2 font-mono text-xs sm:text-sm text-muted-foreground max-w-xs">
          {category
            ? t("emptyDescription", { category })
            : t("comingSoonDescription")}
        </p>
      </div>
    </div>
  );
}
