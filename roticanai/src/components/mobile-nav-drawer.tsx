"use client";

import { CompassIcon, FolderIcon, MenuIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileNavDrawerProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  } | null;
  isAuthenticated: boolean;
  onSignInClick: () => void;
}

function UserAvatar({
  user,
}: {
  user: NonNullable<MobileNavDrawerProps["user"]>;
}) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name}
        width={40}
        height={40}
        className="size-10 object-cover rounded-lg"
      />
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex size-10 items-center justify-center rounded-lg border-2 border-border bg-primary text-primary-foreground">
      <span className="font-mono text-lg">{initials}</span>
    </div>
  );
}

export function MobileNavDrawer({
  user,
  isAuthenticated,
  onSignInClick,
}: MobileNavDrawerProps) {
  const t = useTranslations("header");
  const [open, setOpen] = useState(false);

  const handleSignIn = () => {
    setOpen(false);
    onSignInClick();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center h-8 w-8 border border-border rounded-lg hover:border-primary hover:text-primary transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-sm">
        <SheetHeader className="border-b border-border pb-4">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <UserAvatar user={user} />
              <div className="flex flex-col">
                <span className="font-mono text-sm font-medium">
                  {user.name}
                </span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                  {user.email}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border-2 border-border bg-muted">
                <UserIcon className="size-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-sm font-medium">
                  {t("guest")}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {t("signInToContinue")}
                </span>
              </div>
            </div>
          )}
        </SheetHeader>

        <nav className="flex flex-col gap-1 py-4">
          {!isAuthenticated && (
            <button
              type="button"
              onClick={handleSignIn}
              className="flex items-center gap-3 px-4 py-3 font-mono text-sm text-left hover:bg-muted rounded-lg transition-colors"
            >
              <UserIcon className="size-4" />
              <span>{t("signIn")}</span>
            </button>
          )}

          <Link
            href="/explore"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-muted rounded-lg transition-colors"
          >
            <CompassIcon className="size-4" />
            <span>{t("explore")}</span>
          </Link>

          {isAuthenticated && (
            <Link
              href="/apps"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 font-mono text-sm hover:bg-muted rounded-lg transition-colors"
            >
              <FolderIcon className="size-4" />
              <span>{t("myApps")}</span>
            </Link>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
