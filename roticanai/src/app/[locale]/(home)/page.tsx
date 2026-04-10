import { Effect } from "effect";
import { getInspo } from "@/lib/services/inspo";
import { getServerDailyUsage } from "@/lib/services/usage";
import { HomeClient } from "./home-client";

interface HomePageProps {
  searchParams: Promise<{ inspo?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { inspo: inspoId } = await searchParams;

  // If inspo param is present, fetch the inspo to get its prompt
  let initialPrompt: string | null = null;
  let inspoTitle: string | null = null;

  if (inspoId) {
    const inspo = await Effect.runPromise(getInspo(inspoId));
    if (inspo) {
      initialPrompt = inspo.prompt;
      inspoTitle = inspo.title;
    }
  }

  const initialUsage = await Effect.runPromise(getServerDailyUsage);

  return (
    <HomeClient
      initialPrompt={initialPrompt}
      inspoTitle={inspoTitle}
      initialUsage={initialUsage}
    />
  );
}
