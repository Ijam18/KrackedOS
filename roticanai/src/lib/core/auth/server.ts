import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { Effect } from "effect";
import { db } from "@/db";
import {
  GUEST_COOKIE_NAME,
  GUEST_QUOTA_COOKIE_NAME,
  mergeGuestIntoUser,
} from "@/lib/services/guest";

function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is not set`);
  }
  return value;
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes - session cached in signed cookie
    },
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  socialProviders: {
    google: {
      clientId: getEnvVar("GOOGLE_CLIENT_ID"),
      clientSecret: getEnvVar("GOOGLE_CLIENT_SECRET"),
    },
    github: {
      clientId: getEnvVar("GITHUB_CLIENT_ID"),
      clientSecret: getEnvVar("GITHUB_CLIENT_SECRET"),
    },
  },
  databaseHooks: {
    session: {
      create: {
        async after(session, ctx) {
          if (!ctx) return;

          const program = Effect.gen(function* () {
            const cookieHeader = ctx.request?.headers?.get("cookie") ?? "";
            const guestMatch = cookieHeader.match(
              new RegExp(`${GUEST_COOKIE_NAME}=([^;]+)`),
            );
            const guestQuotaMatch = cookieHeader.match(
              new RegExp(`${GUEST_QUOTA_COOKIE_NAME}=([^;]+)`),
            );
            const guestId = guestMatch?.[1];
            const guestQuotaKey = guestQuotaMatch?.[1];

            if (!guestId || session.userId.startsWith("guest_")) return;

            const result = yield* mergeGuestIntoUser(
              guestId,
              session.userId,
              guestQuotaKey,
            );
            yield* Effect.log(
              `Merged guest ${guestId} into ${session.userId}, transferred ${result.appsTransferred} apps`,
            );
          }).pipe(
            Effect.catchAll((error) =>
              Effect.logError("Failed to merge guest").pipe(
                Effect.annotateLogs("error", String(error)),
              ),
            ),
          );

          await Effect.runPromise(program);
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
