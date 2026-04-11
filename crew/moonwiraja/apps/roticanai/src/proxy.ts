import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// In prod, the root path "/" serves KrackedOS static (kos.html via Next.js rewrite).
// We must skip next-intl middleware for:
//   - "/" (serves KrackedOS)
//   - "/rotican" and "/rotican/*" (Next.js rewrites them to /ms and /:path*)
// In dev, Vite proxy handles "/" and "/rotican" so this code doesn't run for them.
export default function proxy(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/" || pathname === "/rotican" || pathname.startsWith("/rotican/")) {
    return;
  }

  return intlMiddleware(request as Parameters<typeof intlMiddleware>[0]);
}

export const config = {
  // Match everything except: api, _next, _vercel, static file paths, and any path with a file extension.
  // The ".+" requires at least one char after "/", which excludes the root itself from the matcher.
  // /rotican* are matched but the proxy function above skips them.
  matcher: ["/((?!api|_next|_vercel|assets|icons|wallpapers|kdacademy|lesson-visuals|.*\\..*).+)"],
};
