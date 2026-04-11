"use client";

import { LogIn } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SignInModal } from "./sign-in-modal";

export function GuestBanner() {
  const t = useTranslations("guest");
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center gap-2 border-2 border-primary/20 bg-primary/5 p-3 text-center">
        <p className="font-mono text-xs text-muted-foreground">{t("banner")}</p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-3 gap-1.5 font-mono text-xs"
          onClick={() => setShowSignIn(true)}
        >
          <LogIn className="size-3" />
          <span>{t("signIn")}</span>
        </Button>
      </div>
      <SignInModal open={showSignIn} onOpenChange={setShowSignIn} />
    </>
  );
}
