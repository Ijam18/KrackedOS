import { Effect } from "effect";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { Providers } from "@/components/providers";
import {
  AuthProvider,
  type AuthSeed,
} from "@/features/auth/components/auth-provider";
import { GUEST_FLAG_COOKIE_NAME } from "@/features/auth/constants";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/effect/auth";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

async function getAuthSeed(): Promise<AuthSeed | null> {
  const session = await Effect.runPromise(
    getSession.pipe(Effect.catchAll(() => Effect.succeed(null))),
  );

  if (!session) {
    // No real session – check if there's a guest cookie so the server render
    // matches the client (which reads localStorage for the same flag).
    const cookieStore = await cookies();
    const hasGuestCookie =
      cookieStore.get(GUEST_FLAG_COOKIE_NAME)?.value === "1";

    if (hasGuestCookie) {
      return {
        isAuthenticated: true,
        isGuest: true,
        userId: null,
        userName: null,
        userImage: null,
        userEmail: null,
      };
    }

    return null;
  }

  const isGuest = session.user.id.startsWith("guest_");

  return {
    isAuthenticated: true,
    isGuest,
    userId: session.user.id,
    userName: session.user.name,
    userImage: session.user.image ?? null,
    userEmail: session.user.email,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const [messages, authSeed] = await Promise.all([
    getMessages(),
    getAuthSeed(),
  ]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        <AuthProvider session={authSeed}>
          <div className="flex h-dvh flex-col overflow-hidden">
            {children}
          </div>
        </AuthProvider>
      </Providers>
    </NextIntlClientProvider>
  );
}
