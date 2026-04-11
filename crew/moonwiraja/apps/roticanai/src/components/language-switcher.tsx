"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const switchLocale = (newLocale: string) => {
    // Save preference in cookie (next-intl reads NEXT_LOCALE automatically)
    cookieStore.set({
      name: "NEXT_LOCALE",
      value: newLocale,
      path: "/",
      expires: Date.now() + 60 * 60 * 24 * 365 * 1000,
    });

    // Replace the locale prefix in the current path
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
    setIsExpanded(false);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: Always show both */}
      <div className="hidden sm:flex items-center border-2 border-border rounded-lg overflow-hidden h-8">
        <button
          type="button"
          onClick={() => switchLocale("en")}
          className={cn(
            "h-full px-2 font-mono text-sm transition-colors flex items-center justify-center",
            locale === "en"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-primary",
          )}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => switchLocale("ms")}
          className={cn(
            "h-full px-2 font-mono text-sm transition-colors flex items-center justify-center",
            locale === "ms"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-primary",
          )}
        >
          BM
        </button>
      </div>

      {/* Mobile: Show active only, expand on click */}
      <div className="flex sm:hidden">
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="h-8 px-3 font-mono text-sm bg-primary text-primary-foreground rounded-lg border-2 border-border flex items-center justify-center"
          >
            {locale === "en" ? "EN" : "BM"}
          </button>
        ) : (
          <div className="flex items-center border-2 border-border rounded-lg overflow-hidden h-8 animate-in fade-in slide-in-from-left-2 duration-200">
            <button
              type="button"
              onClick={() => switchLocale("en")}
              className={cn(
                "h-full px-2 font-mono text-sm transition-colors flex items-center justify-center",
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-primary",
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => switchLocale("ms")}
              className={cn(
                "h-full px-2 font-mono text-sm transition-colors flex items-center justify-center",
                locale === "ms"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-primary",
              )}
            >
              BM
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
