"use client";

import { FolderOpen, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DailyUsageIndicator } from "@/features/apps/components/daily-usage-indicator";
import { signOutCurrentUser } from "@/lib/core/auth/client";

type UserMenuProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    isGuest?: boolean;
  };
};

function UserAvatar({ user }: { user: UserMenuProps["user"] }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name}
        width={32}
        height={32}
        className="size-8 object-cover"
      />
    );
  }

  // Fallback to initials
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex size-8 items-center justify-center rounded-sm border-2 border-border bg-primary text-primary-foreground">
      <span className="font-mono text-base">{initials}</span>
    </div>
  );
}

export function UserMenu({ user }: UserMenuProps) {
  const t = useTranslations("auth");
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutCurrentUser(user.isGuest ?? false);
    router.replace("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 h-8 border-2 border-border rounded-lg overflow-hidden transition-colors focus:outline-none focus:ring-1 focus:ring-foreground"
        >
          <UserAvatar user={user} />
          <span className="hidden font-mono text-sm tracking-tight text-muted-foreground group-hover:text-primary pr-3 sm:inline-block">
            {user.name}
          </span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 font-mono">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="font-medium text-sm leading-none">{user.name}</p>
            <p className="text-xs text-muted-foreground leading-none truncate">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="font-normal py-1.5">
          <DailyUsageIndicator variant="compact" />
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/apps" className="flex items-center gap-2 cursor-pointer">
            <FolderOpen className="size-4" />
            <span>{t("myApps")}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          <span>{t("signOut")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
