import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/core/auth/server";
import { getApp } from "@/lib/services/app";
import { getGuestIdFromCookie } from "@/lib/services/guest";
import { getMessagesForApp } from "@/lib/services/message";
import { AppWorkspace } from "./app-workspace";

interface AppPageProps {
  params: Promise<{ id: string }>;
}

export default async function AppPage({ params }: AppPageProps) {
  const { id: appId } = await params;

  // Get session (server-side) — try Better Auth, then guest cookie
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = session?.user.id ?? (await getGuestIdFromCookie());

  // Redirect to home if not authenticated at all
  if (!userId) {
    redirect("/?auth=required");
  }

  // Load app from database
  const app = await getApp(appId, userId);

  // 404 if app doesn't exist or user doesn't own it
  if (!app) {
    notFound();
  }

  // Load messages for this app
  const messages = await getMessagesForApp(appId);

  // If no messages yet but app has a description (initialPrompt), pass it to client
  // The client will send it as the first message to trigger LLM response
  const initialPrompt = messages.length === 0 ? app.description : null;

  // Get the current user's username for the share modal publish prompt
  const userRow = await db
    .select({ username: user.username })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  const currentUsername = userRow[0]?.username ?? null;

  return (
    <AppWorkspace
      appId={appId}
      app={app}
      initialMessages={messages}
      initialPrompt={initialPrompt}
      currentUsername={currentUsername}
    />
  );
}
