"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/ui/utils";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    setIsExpanded(false);
  };

  // Prevent hydration mismatch by rendering neutral state until mounted
  if (!mounted) {
    return (
      <div className="hidden sm:flex items-center border-2 border-border rounded-lg overflow-hidden h-8">
        <button
          type="button"
          className="h-full px-2 transition-colors flex items-center justify-center bg-background text-muted-foreground"
          aria-label="Light mode"
          disabled
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="h-full px-2 transition-colors flex items-center justify-center bg-background text-muted-foreground"
          aria-label="Dark mode"
          disabled
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  const isLight = resolvedTheme === "light";

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: Always show both */}
      <div className="hidden sm:flex items-center border-2 border-border rounded-lg overflow-hidden h-8">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={cn(
            "h-full px-2 transition-colors flex items-center justify-center",
            resolvedTheme === "light"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-primary",
          )}
          aria-label="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={cn(
            "h-full px-2 transition-colors flex items-center justify-center",
            resolvedTheme === "dark"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:text-primary",
          )}
          aria-label="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile: Show active only, expand on click */}
      <div className="flex sm:hidden">
        {!isExpanded ? (
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="h-8 px-3 bg-primary text-primary-foreground rounded-lg border-2 border-border flex items-center justify-center"
            aria-label={isLight ? "Light mode" : "Dark mode"}
          >
            {isLight ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        ) : (
          <div className="flex items-center border-2 border-border rounded-lg overflow-hidden h-8 animate-in fade-in slide-in-from-left-2 duration-200">
            <button
              type="button"
              onClick={() => handleSetTheme("light")}
              className={cn(
                "h-full px-2 transition-colors flex items-center justify-center",
                resolvedTheme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-primary",
              )}
              aria-label="Light mode"
            >
              <Sun className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleSetTheme("dark")}
              className={cn(
                "h-full px-2 transition-colors flex items-center justify-center",
                resolvedTheme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:text-primary",
              )}
              aria-label="Dark mode"
            >
              <Moon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
