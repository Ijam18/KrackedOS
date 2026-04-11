"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "@/lib/core/auth/client";

function AuthPopupInner() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") as "google" | "github" | "discord" | null;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!provider) {
      setError("No provider specified");
      return;
    }

    // Call better-auth signIn.social from the first-party context
    signIn.social({
      provider,
      callbackURL: "/auth-callback",
    }).catch((err) => {
      setError(err?.message || "Failed to initialize login");
    });
  }, [provider]);

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-red-500 font-bold">Ralat Log Masuk</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={() => window.close()} 
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Tutup
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      <p className="text-sm animate-pulse">Menghubungkan ke {provider}...</p>
    </div>
  );
}

export default function AuthPopupPage() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-mono">
      <Suspense fallback={<div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>}>
        <AuthPopupInner />
      </Suspense>
    </div>
  );
}
