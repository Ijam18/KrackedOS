"use client";

import { CompassIcon, FolderIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SignInModal } from "@/features/auth/components/sign-in-modal";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cn } from "@/lib/ui/utils";
import { HeaderAuth } from "./header-auth";
import { LanguageSwitcher } from "./language-switcher";
import { MobileNavDrawer } from "./mobile-nav-drawer";
import { ThemeToggle } from "./theme-toggle";

interface AppHeaderProps {
  fullWidth?: boolean;
}

export function AppHeader({ fullWidth }: AppHeaderProps = {}) {
  const { user, isAuthenticated, isGuest } = useAuth();
  const t = useTranslations("header");
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <header className="bg-background">
      <div
        className={cn(
          "mx-auto px-3 sm:px-4 py-3 flex items-center justify-between",
          !fullWidth && "max-w-6xl",
        )}
      >
        {/* Left: Locale + Theme */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>

        {/* Center: Logo */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 text-lg text-primary hover:opacity-80 transition-opacity lowercase font-pixel"
        >
          rotican.ai
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center gap-2">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg font-mono text-xs tracking-tight text-muted-foreground hover:text-primary transition-colors"
          >
            <CompassIcon className="size-3 opacity-50" />
            <span>{t("explore")}</span>
          </Link>
          {isAuthenticated && (
            <Link
              href="/apps"
              className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg font-mono text-xs tracking-tight text-muted-foreground hover:text-primary transition-colors"
            >
              <FolderIcon className="size-3 opacity-50" />
              <span>{t("myApps")}</span>
            </Link>
          )}
          <HeaderAuth
            user={
              user
                ? {
                    id: user.id,
                    name: user.name ?? "",
                    email: user.email ?? "",
                    image: user.image,
                    isGuest,
                  }
                : null
            }
          />
        </div>

        {/* Mobile: Avatar + Hamburger */}
        <div className="flex sm:hidden items-center gap-2">
          {isAuthenticated && user ? (
            <HeaderAuth
              user={{
                id: user.id,
                name: user.name ?? "",
                email: user.email ?? "",
                image: user.image,
                isGuest,
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowSignIn(true)}
              className="flex items-center justify-center h-8 px-3 border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
            >
              <span className="font-mono text-xs">{t("signIn")}</span>
            </button>
          )}
          <MobileNavDrawer
            user={
              user
                ? {
                    id: user.id,
                    name: user.name ?? "",
                    email: user.email ?? "",
                    image: user.image,
                  }
                : null
            }
            isAuthenticated={isAuthenticated}
            onSignInClick={() => setShowSignIn(true)}
          />
        </div>
      </div>

      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </header>
  );
}
