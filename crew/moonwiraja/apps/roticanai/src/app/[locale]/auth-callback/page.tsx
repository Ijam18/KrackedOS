"use client";

import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Menyelesaikan log masuk...");

  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      setStatus("Selesai! Menutup paparan ini...");
      // Hantar mesej ke tetingkap utama (iframe)
      window.opener.postMessage("oauth-success", "*");
      // Tutup tetingkap popup
      setTimeout(() => {
        window.close();
      }, 500);
    } else if (typeof window !== "undefined") {
      setStatus("Gagal berkomunikasi. Sila tutup tetingkap ini manual.");
      setTimeout(() => {
        window.close();
      }, 2000);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-mono">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        <p className="text-sm">{status}</p>
      </div>
    </div>
  );
}
