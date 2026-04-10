"use client";

import {
  ArrowLeftIcon,
  Gamepad2Icon,
  GlobeIcon,
  HeartIcon,
  Loader2Icon,
  PaletteIcon,
  RefreshCwIcon,
  SparklesIcon,
  WrenchIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/ui/utils";
import {
  useGuidedIdeasMutation,
  useGuidedPromptMutation,
  type WizardIdeaOption,
} from "../hooks/queries";
import {
  IDEA_WIZARD_CATEGORIES,
  type IdeaWizardCategory,
  type IdeaWizardPreference,
} from "../idea-wizard-data";

interface HomeIdeaWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disabled?: boolean;
  onSubmit: (params: { text: string }) => void | Promise<void>;
}

function CategoryIcon({
  icon,
  className,
}: {
  icon: IdeaWizardCategory["icon"];
  className?: string;
}) {
  switch (icon) {
    case "gamepad":
      return <Gamepad2Icon className={className} />;
    case "globe":
      return <GlobeIcon className={className} />;
    case "wrench":
      return <WrenchIcon className={className} />;
    case "chart":
      return <SparklesIcon className={className} />;
    case "palette":
      return <PaletteIcon className={className} />;
    case "heart":
      return <HeartIcon className={className} />;
  }
}

export function HomeIdeaWizard({
  open,
  onOpenChange,
  disabled,
  onSubmit,
}: HomeIdeaWizardProps) {
  const t = useTranslations("home.ideaWizard");
  const locale = useLocale() === "ms" ? "ms" : "en";
  const guidedIdeasMutation = useGuidedIdeasMutation();
  const guidedPromptMutation = useGuidedPromptMutation();

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<WizardIdeaOption[]>([]);
  const [ideasError, setIdeasError] = useState<string | null>(null);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState<string | null>(
    null,
  );
  const [refreshCount, setRefreshCount] = useState(0);

  const category =
    IDEA_WIZARD_CATEGORIES.find((item) => item.id === categoryId) ?? null;
  const preference =
    category?.preferences.find((item) => item.id === preferenceId) ?? null;

  const resetState = () => {
    setCategoryId(null);
    setPreferenceId(null);
    setIdeas([]);
    setIdeasError(null);
    setPromptError(null);
    setSelectedIdeaTitle(null);
    setRefreshCount(0);
    guidedIdeasMutation.reset();
    guidedPromptMutation.reset();
  };

  const close = () => {
    resetState();
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const isLoadingIdeas = guidedIdeasMutation.isPending;
  const isBuildingPrompt = guidedPromptMutation.isPending;

  const loadIdeas = async ({
    category,
    preference,
    nextRefreshCount,
  }: {
    category: IdeaWizardCategory;
    preference: IdeaWizardPreference;
    nextRefreshCount: number;
  }) => {
    setIdeasError(null);
    setPromptError(null);
    setSelectedIdeaTitle(null);

    try {
      const nextIdeas = await guidedIdeasMutation.mutateAsync({
        locale,
        category: category.id,
        categoryLabel: t(category.labelKey),
        preference: preference.id,
        preferenceLabel: t(preference.labelKey),
        refreshCount: nextRefreshCount,
      });

      setIdeas(nextIdeas);
      setRefreshCount(nextRefreshCount);
    } catch (error) {
      setIdeasError(
        error instanceof Error ? error.message : t("errors.genericIdeas"),
      );
    }
  };

  const handleCategorySelect = (nextCategory: IdeaWizardCategory) => {
    setCategoryId(nextCategory.id);
    setPreferenceId(null);
    setIdeas([]);
    setIdeasError(null);
    setPromptError(null);
    setRefreshCount(0);
    guidedIdeasMutation.reset();
    guidedPromptMutation.reset();
  };

  const handlePreferenceSelect = async (
    nextPreference: IdeaWizardPreference,
  ) => {
    if (!category) return;

    setPreferenceId(nextPreference.id);
    setIdeas([]);
    await loadIdeas({
      category,
      preference: nextPreference,
      nextRefreshCount: 0,
    });
  };

  const handleRefreshIdeas = async () => {
    if (!category || !preference || refreshCount >= 1) return;

    await loadIdeas({
      category,
      preference,
      nextRefreshCount: refreshCount + 1,
    });
  };

  const handleIdeaSelect = async (idea: WizardIdeaOption) => {
    if (!category || !preference || isBuildingPrompt) return;

    setPromptError(null);
    setSelectedIdeaTitle(idea.title);

    try {
      const prompt = await guidedPromptMutation.mutateAsync({
        locale,
        category: category.id,
        categoryLabel: t(category.labelKey),
        preference: preference.id,
        preferenceLabel: t(preference.labelKey),
        ideaTitle: idea.title,
        ideaDescription: idea.description,
        ideaStarter: idea.starter,
      });

      close();
      await onSubmit({ text: prompt });
    } catch (error) {
      setPromptError(
        error instanceof Error ? error.message : t("errors.genericPrompt"),
      );
    }
  };

  const showSuggestions =
    category != null &&
    preference != null &&
    (ideas.length > 0 || isLoadingIdeas);
  const showReset = category != null || preference != null || ideas.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="border-border bg-background p-0 font-mono sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 pt-6 pb-4 text-left">
          <DialogTitle className="text-lg uppercase tracking-wide">
            {t("title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <span
                className={cn(
                  "rounded-full border px-2 py-1",
                  !category
                    ? "border-foreground text-foreground"
                    : "border-border",
                )}
              >
                1. {t("steps.category")}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-1",
                  category && !preference
                    ? "border-foreground text-foreground"
                    : "border-border",
                )}
              >
                2. {t("steps.preference")}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-1",
                  showSuggestions
                    ? "border-foreground text-foreground"
                    : "border-border",
                )}
              >
                3. {t("steps.idea")}
              </span>
            </div>
            {showReset ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetState}
                disabled={isLoadingIdeas || isBuildingPrompt}
                className="font-mono text-xs uppercase tracking-wide"
              >
                {t("startOver")}
              </Button>
            ) : null}
          </div>

          {category && (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
                {t(category.labelKey)}
              </span>
              {preference && (
                <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                  {t(preference.labelKey)}
                </span>
              )}
            </div>
          )}

          {!category ? (
            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("chooseCategory")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {IDEA_WIZARD_CATEGORIES.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleCategorySelect(item)}
                    disabled={disabled}
                    className="group rounded-xl border border-border bg-background px-4 py-4 text-left transition-colors hover:border-foreground disabled:opacity-50"
                  >
                    <CategoryIcon
                      icon={item.icon}
                      className="mb-4 size-4 text-muted-foreground transition-colors group-hover:text-foreground"
                    />
                    <div className="text-sm text-foreground">
                      {t(item.labelKey)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {category && !preference ? (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCategoryId(null)}
                  className="h-8 px-2 font-mono"
                >
                  <ArrowLeftIcon className="size-3.5" />
                  {t("back")}
                </Button>
                <div>
                  <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                    {t("choosePreference")}
                  </h3>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {category.preferences.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePreferenceSelect(item)}
                    disabled={disabled || isLoadingIdeas}
                    className="rounded-xl border border-border bg-background px-4 py-4 text-left transition-colors hover:border-foreground disabled:opacity-50"
                  >
                    <div className="text-sm text-foreground">
                      {t(item.labelKey)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {showSuggestions ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreferenceId(null);
                      setIdeas([]);
                      setIdeasError(null);
                      setPromptError(null);
                      setRefreshCount(0);
                      guidedIdeasMutation.reset();
                      guidedPromptMutation.reset();
                    }}
                    disabled={isLoadingIdeas || isBuildingPrompt}
                    className="h-8 px-2 font-mono"
                  >
                    <ArrowLeftIcon className="size-3.5" />
                    {t("back")}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshIdeas}
                    disabled={
                      isLoadingIdeas ||
                      isBuildingPrompt ||
                      refreshCount >= 1 ||
                      ideas.length === 0
                    }
                    className="h-8 font-mono text-xs uppercase tracking-wide"
                  >
                    <RefreshCwIcon className="size-3.5" />
                    {t("refreshIdeas")}
                  </Button>
                </div>
              </div>

              {isLoadingIdeas ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-10 text-center">
                  <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                  <p className="pt-4 text-sm text-foreground">
                    {t("loadingIdeasTitle")}
                  </p>
                </div>
              ) : null}

              {ideasError ? (
                <div className="rounded-xl border border-dashed border-destructive/40 px-4 py-5">
                  <p className="text-sm text-foreground">
                    {t("errors.ideasTitle")}
                  </p>
                  <p className="pt-1 text-xs text-muted-foreground">
                    {ideasError}
                  </p>
                  <div className="pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (category && preference) {
                          loadIdeas({
                            category,
                            preference,
                            nextRefreshCount: refreshCount,
                          });
                        }
                      }}
                      className="font-mono text-xs uppercase tracking-wide"
                    >
                      {t("tryAgain")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {!isLoadingIdeas && ideas.length > 0 ? (
                <div className="grid gap-3">
                  {ideas.map((idea) => {
                    const isSelected = selectedIdeaTitle === idea.title;

                    return (
                      <button
                        key={idea.title}
                        type="button"
                        onClick={() => handleIdeaSelect(idea)}
                        disabled={disabled || isBuildingPrompt}
                        className={cn(
                          "rounded-xl border px-4 py-3 text-left transition-colors",
                          isSelected
                            ? "border-foreground bg-accent/30"
                            : "border-border bg-background hover:border-foreground",
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-sm text-foreground">
                              {idea.title}
                            </div>
                            <div className="pt-1 text-xs text-muted-foreground">
                              {idea.starter}
                            </div>
                          </div>
                          {isSelected && isBuildingPrompt ? (
                            <Loader2Icon className="mt-1 size-4 animate-spin text-muted-foreground" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {isBuildingPrompt ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-4">
                  <p className="text-sm text-foreground">
                    {t("loadingPromptTitle")}
                  </p>
                </div>
              ) : null}

              {promptError ? (
                <div className="rounded-xl border border-dashed border-destructive/40 px-4 py-4">
                  <p className="text-sm text-foreground">
                    {t("errors.promptTitle")}
                  </p>
                  <p className="pt-1 text-xs text-muted-foreground">
                    {promptError}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
