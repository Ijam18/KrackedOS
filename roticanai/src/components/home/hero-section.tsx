import { SparklesIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useTranslations } from "next-intl";

const rise = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
} as const;

interface HeroSectionProps {
  isRemixing: boolean;
  inspoTitle?: string | null;
}

export function HeroSection({ isRemixing, inspoTitle }: HeroSectionProps) {
  const t = useTranslations("home");

  if (isRemixing && inspoTitle) {
    return (
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center py-4 gap-2"
        {...rise}
      >
        <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
          <SparklesIcon className="size-4" />
          <span>{t("remixing")}</span>
        </div>
        <h1 className="font-mono text-2xl md:text-3xl tracking-tight uppercase text-foreground text-center">
          {inspoTitle.toUpperCase()}
        </h1>
        <Link
          href="/inspo"
          className="font-mono text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          {t("browseMoreInspo")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative z-10 flex flex-col items-center justify-center py-2 md:py-4 gap-2"
      {...rise}
    >
      <h1 className="font-pixel text-5xl md:text-6xl lg:text-7xl text-foreground">
        rotican.ai
      </h1>
    </motion.div>
  );
}
