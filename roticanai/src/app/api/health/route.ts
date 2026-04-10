import { FetchHttpClient, HttpClient } from "@effect/platform";
import { Effect } from "effect";
import { HealthParams, parseSearchParams, runHandler } from "@/lib/effect";

export const GET = (req: Request) =>
  runHandler(
    Effect.gen(function* () {
      const { url } = yield* parseSearchParams(HealthParams, req);

      const ready = yield* HttpClient.head(url).pipe(
        Effect.timeout("500 millis"),
        Effect.map((res) => res.status >= 200 && res.status < 300),
        Effect.provide(FetchHttpClient.layer),
        Effect.catchAll(() => Effect.succeed(false)),
      );

      if (ready) {
        yield* Effect.log(`[Health] ${url} is ready`);
      }

      return { ready };
    }),
  );
