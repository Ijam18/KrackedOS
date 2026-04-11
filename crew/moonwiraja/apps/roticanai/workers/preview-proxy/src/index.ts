interface Env {
  API_BASE_URL: string;
}

interface PreviewResponse {
  appId: string;
  previewUrl: string | null;
  sandboxId: string | null;
  snapshotId: string | null;
  status: "live" | "dead" | "no-snapshot";
}

function getLoadingPage(appId: string, apiBaseUrl: string): string {
  return `<!DOCTYPE html>
<html data-loading="true">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Starting up... | Roti Canai</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --background: #0a0a0a;
      --foreground: #fafafa;
      --muted: #262626;
      --muted-foreground: #a3a3a3;
      --border: #262626;
      --primary: #fafafa;
      --radius: 10px;
    }
    
    body {
      background: var(--background);
      color: var(--foreground);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    
    .header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
    }
    
    .logo {
      font-weight: 600;
      font-size: 14px;
      color: var(--foreground);
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    
    .logo:hover {
      opacity: 0.8;
    }
    
    .main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .container {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
      max-width: 320px;
    }
    
    .spinner-container {
      position: relative;
      width: 48px;
      height: 48px;
    }
    
    .spinner {
      width: 48px;
      height: 48px;
      border: 2px solid var(--muted);
      border-top-color: var(--foreground);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .title {
      font-weight: 600;
      font-size: 16px;
      color: var(--foreground);
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      font-size: 14px;
      color: var(--muted-foreground);
    }
    
    .error {
      font-size: 14px;
      color: #ef4444;
      display: none;
      max-width: 280px;
      line-height: 1.5;
    }
    
    .no-snapshot {
      color: #f59e0b;
    }
    
    .footer {
      padding: 16px 24px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    
    .footer-text {
      font-size: 13px;
      color: var(--muted-foreground);
    }
    
    .footer-link {
      color: var(--foreground);
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .dots::after {
      content: '';
      animation: dots 1.5s steps(4, end) infinite;
    }
    
    @keyframes dots {
      0% { content: ''; }
      25% { content: '.'; }
      50% { content: '..'; }
      75% { content: '...'; }
      100% { content: ''; }
    }
  </style>
</head>
<body>
  <header class="header">
    <a href="https://rotican.ai" class="logo">Roti Canai</a>
  </header>
  
  <main class="main">
    <div class="container">
      <div class="spinner-container">
        <div class="spinner"></div>
      </div>
      <div class="title" id="title">Waking up<span class="dots"></span></div>
      <div class="subtitle" id="subtitle">This app is starting, please wait</div>
      <div class="error" id="error">Something went wrong. Please try again.</div>
      <div class="error no-snapshot" id="no-snapshot">This app has no saved state and cannot be started.</div>
    </div>
  </main>
  
  <footer class="footer">
    <p class="footer-text">
      Built with <a href="https://rotican.ai" class="footer-link">Roti Canai</a>
    </p>
  </footer>

  <script>
    // Wake up logic
    const appId = "${appId}";
    const apiBaseUrl = "${apiBaseUrl}";

    fetch(apiBaseUrl + "/api/preview/" + appId + "/wake", { method: "POST" }).catch(() => {});

    async function poll() {
      try {
        const res = await fetch(apiBaseUrl + "/api/preview/" + appId + "/status");
        const data = await res.json().catch(() => ({}));
        if (data.status === "live") {
          document.getElementById("title").textContent = "Ready!";
          document.getElementById("subtitle").textContent = "Redirecting...";
          setTimeout(() => window.location.reload(), 1000);
        } else if (data.status === "error") {
          document.getElementById("title").textContent = "Error";
          document.getElementById("subtitle").style.display = "none";
          document.getElementById("error").style.display = "block";
        } else if (data.status === "no-snapshot") {
          document.getElementById("title").textContent = "No Snapshot";
          document.getElementById("subtitle").style.display = "none";
          document.getElementById("no-snapshot").style.display = "block";
        } else {
          setTimeout(poll, 2000);
        }
      } catch {
        setTimeout(poll, 2000);
      }
    }

    poll();
  </script>
</body>
</html>`;
}

function getNotFoundPage(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not Found | Roti Canai</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --background: #0a0a0a;
      --foreground: #fafafa;
      --muted: #262626;
      --muted-foreground: #a3a3a3;
      --border: #262626;
      --primary: #fafafa;
      --radius: 10px;
    }
    
    body {
      background: var(--background);
      color: var(--foreground);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
    }
    
    .header {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
    }
    
    .logo {
      font-weight: 600;
      font-size: 14px;
      color: var(--foreground);
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    
    .main {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    
    .container {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      max-width: 320px;
    }
    
    .icon {
      font-size: 48px;
      margin-bottom: 8px;
    }
    
    .title {
      font-weight: 600;
      font-size: 18px;
      color: var(--foreground);
      letter-spacing: -0.02em;
    }
    
    .subtitle {
      font-size: 14px;
      color: var(--muted-foreground);
    }
    
    .btn {
      margin-top: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 8px 16px;
      background: var(--foreground);
      color: var(--background);
      font-weight: 500;
      font-size: 14px;
      text-decoration: none;
      border-radius: var(--radius);
      transition: opacity 0.15s;
    }
    
    .btn:hover {
      opacity: 0.9;
    }
    
    .footer {
      padding: 16px 24px;
      text-align: center;
      border-top: 1px solid var(--border);
    }
    
    .footer-text {
      font-size: 13px;
      color: var(--muted-foreground);
    }
    
    .footer-link {
      color: var(--foreground);
      text-decoration: none;
      font-weight: 500;
    }
    
    .footer-link:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <header class="header">
    <a href="https://rotican.ai" class="logo">Roti Canai</a>
  </header>
  
  <main class="main">
    <div class="container">
      <div class="icon">404</div>
      <div class="title">Not Found</div>
      <div class="subtitle">This app doesn't exist or may have been deleted.</div>
      <a href="https://rotican.ai" class="btn">Create your own</a>
    </div>
  </main>
  
  <footer class="footer">
    <p class="footer-text">
      Built with <a href="https://rotican.ai" class="footer-link">Roti Canai</a>
    </p>
  </footer>
</body>
</html>`;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const hostname = url.hostname;

    // Extract subdomain: "abc123" from "abc123.rotican.ai"
    const parts = hostname.split(".");
    const subdomain = parts[0];

    // Skip if it's the root domain, www, or app
    if (
      !subdomain ||
      subdomain === "rotican" ||
      subdomain === "www" ||
      subdomain === "app"
    ) {
      // Pass through to origin
      return fetch(request);
    }

    // Lookup app preview URL from API
    const apiRes = await fetch(`${env.API_BASE_URL}/api/preview/${subdomain}`);

    if (!apiRes.ok) {
      return new Response(getNotFoundPage(), {
        status: 404,
        headers: { "Content-Type": "text/html" },
      });
    }

    const data: PreviewResponse = await apiRes.json();

    // If sandbox is dead or no URL, trigger wake and show loading page
    if (data.status !== "live" || !data.previewUrl) {
      triggerWake(env.API_BASE_URL, subdomain, ctx);
      return new Response(getLoadingPage(subdomain, env.API_BASE_URL), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Proxy to Modal tunnel
    const targetUrl = new URL(url.pathname + url.search, data.previewUrl);

    // Create clean headers - only forward essential ones
    // Cloudflare adds many cf-* headers that Modal might not like
    const proxyHeaders = new Headers();

    // Forward only essential headers
    const headersToForward = [
      "accept",
      "accept-language",
      "accept-encoding",
      "content-type",
      "content-length",
      "user-agent",
      "cache-control",
      "if-none-match",
      "if-modified-since",
    ];

    for (const header of headersToForward) {
      const value = request.headers.get(header);
      if (value) {
        proxyHeaders.set(header, value);
      }
    }

    const proxyRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: proxyHeaders,
      body: request.body,
    });

    try {
      const response = await fetch(proxyRequest);

      // Check for gateway/SSL errors that indicate the sandbox is dead
      // 502/503/504 = gateway errors, 525/526 = SSL handshake failed (Cloudflare can't connect)
      if (
        response.status === 502 ||
        response.status === 503 ||
        response.status === 504 ||
        response.status === 525 ||
        response.status === 526
      ) {
        triggerWake(env.API_BASE_URL, subdomain, ctx);
        return new Response(getLoadingPage(subdomain, env.API_BASE_URL), {
          headers: { "Content-Type": "text/html" },
        });
      }

      return response;
    } catch {
      // If proxy fails (network error), sandbox might have died - show loading page
      triggerWake(env.API_BASE_URL, subdomain, ctx);
      return new Response(getLoadingPage(subdomain, env.API_BASE_URL), {
        headers: { "Content-Type": "text/html" },
      });
    }
  },
} satisfies ExportedHandler<Env>;

function triggerWake(
  apiBaseUrl: string,
  subdomain: string,
  ctx: ExecutionContext,
): void {
  // Fire-and-forget wake request
  ctx.waitUntil(
    fetch(`${apiBaseUrl}/api/preview/${subdomain}/wake`, {
      method: "POST",
    }).catch(() => {}),
  );
}
