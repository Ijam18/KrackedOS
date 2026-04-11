"use client";

import Link from "next/link";
import { UserMenu } from "@/features/auth/components/user-menu";
import { useAuth } from "@/features/auth/hooks/use-auth";

interface HeaderProps {
  error?: string | null;
}

export function Header({ error }: HeaderProps) {
  const { user, isGuest, isLoading } = useAuth();

  return (
    <div className="flex h-14 items-center justify-between border-b-4 border-border bg-card px-4">
      {/* Logo Section */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="font-mono text-sm text-primary hover: transition-all"
        >
          ROTI CANAI
        </Link>
        <div className="flex items-center border-2 border-border bg-background px-2 py-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            SANDBOX
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Error Section */}
        {error && (
          <div className="border-2 border-destructive bg-destructive/10 px-2 py-1">
            <span className="font-mono text-xs text-destructive max-w-[200px] truncate block">
              {error}
            </span>
          </div>
        )}

        {/* User Menu */}
        {!isLoading && user && (
          <UserMenu
            user={{
              id: user.id,
              name: user.name ?? "User",
              email: user.email ?? "",
              image: user.image,
              isGuest,
            }}
          />
        )}
      </div>
    </div>
  );
}
