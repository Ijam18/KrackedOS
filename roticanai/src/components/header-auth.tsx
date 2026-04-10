"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { SignInModal } from "@/features/auth/components/sign-in-modal";
import { UserMenu } from "@/features/auth/components/user-menu";

type HeaderAuthProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    isGuest?: boolean;
  } | null;
};

export function HeaderAuth({ user }: HeaderAuthProps) {
  const t = useTranslations("header");
  const [showSignIn, setShowSignIn] = useState(false);

  if (user) {
    return <UserMenu user={user} />;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowSignIn(true)}
        className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg font-mono text-xs tracking-tight uppercase text-muted-foreground hover:text-primary transition-colors"
      >
        {t("signIn")}
      </button>
      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </>
  );
}
