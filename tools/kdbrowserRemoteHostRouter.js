import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { acceptWebSocketUpgrade } from './minimalWebSocketServer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workerEntryPath = path.join(__dirname, 'kdbrowserRemoteChromiumWorker.js');
const WORKER_READY_TIMEOUT_MS = 15000;
const REQUEST_TIMEOUT_MS = 60000;
const REMOTE_BROWSER_BASE_PATH = '/__kdbrowser-remote';

function toErrorMessage(error, fallback = 'Remote browser service failed.') {
  return error instanceof Error ? error.message : fallback;
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function safeDecode(value = '') {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toDecoratedSession(session) {
  if (!session || typeof session !== 'object' || !session.sessionId) return session;
  return {
    ...session,
    driver: session.driver || 'chromium-cdp-stream',
    streamUrl: `${REMOTE_BROWSER_BASE_PATH}/sessions/${encodeURIComponent(session.sessionId)}/stream`
  };
}

class KDBrowserRemoteHostService {
  constructor() {
    this.worker = null;
    this.readyPromise = null;
    this.pendingRequests = new Map();
    this.streamClients = new Map();
  }

  handleWorkerMessage = (message = {}) => {
    if (message.type === 'ready') {
      this.resolveReady?.();
      this.resolveReady = null;
      this.rejectReady = null;
      return;
    }

    if (message.type === 'event') {
      this.handleWorkerEvent(message);
      return;
    }

    if (message.type !== 'response' || !message.requestId) return;
    const pending = this.pendingRequests.get(message.requestId);
    if (!pending) return;

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(message.requestId);

    if (message.ok) {
      pending.resolve(message.result);
    } else {
      pending.reject(new Error(message.error || 'Remote browser worker request failed.'));
    }
  };

  handleWorkerEvent(message = {}) {
    const clients = this.streamClients.get(message.sessionId);
    if (!clients?.size) return;

    if (message.event === 'session:frame' && message.data) {
      const frameBuffer = Buffer.from(message.data, 'base64');
      clients.forEach((client) => {
        client.sendBinary(frameBuffer);
      });
      return;
    }

    if (message.event === 'session:state' && message.session) {
      const payload = JSON.stringify({
        type: 'state',
        session: toDecoratedSession(message.session)
      });
      clients.forEach((client) => {
        client.sendText(payload);
      });
    }
  }

  async ensureWorker() {
    if (this.worker && !this.worker.killed && this.readyPromise) {
      return this.readyPromise;
    }

    this.shutdown();

    this.readyPromise = new Promise((resolve, reject) => {
      this.resolveReady = resolve;
      this.rejectReady = reject;
    });

    const child = spawn(process.execPath, [workerEntryPath], {
      cwd: process.cwd(),
      stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
      env: { ...process.env }
    });

    this.worker = child;
    const readyTimeoutId = setTimeout(() => {
      this.rejectReady?.(new Error('Timed out while starting the remote browser worker.'));
      this.resolveReady = null;
      this.rejectReady = null;
      this.shutdown();
    }, WORKER_READY_TIMEOUT_MS);

    child.on('message', this.handleWorkerMessage);
    child.once('exit', (code, signal) => {
      clearTimeout(readyTimeoutId);
      if (this.rejectReady) {
        this.rejectReady(new Error(`Remote browser worker exited before ready (code ${code ?? 'n/a'}, signal ${signal ?? 'n/a'}).`));
        this.resolveReady = null;
        this.rejectReady = null;
      }

      this.worker = null;
      this.readyPromise = null;
      this.pendingRequests.forEach((pending, requestId) => {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error('Remote browser worker exited unexpectedly.'));
        this.pendingRequests.delete(requestId);
      });

      this.streamClients.forEach((clients) => {
        clients.forEach((client) => client.close());
      });
      this.streamClients.clear();
    });
    child.once('error', (error) => {
      clearTimeout(readyTimeoutId);
      this.rejectReady?.(error);
      this.resolveReady = null;
      this.rejectReady = null;
      this.shutdown();
    });

    this.readyPromise = this.readyPromise.then((value) => {
      clearTimeout(readyTimeoutId);
      return value;
    });

    return this.readyPromise;
  }

  async request(kind, payload = {}) {
    await this.ensureWorker();

    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Remote browser request timed out: ${kind}`));
      }, REQUEST_TIMEOUT_MS);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeoutId
      });

      this.worker?.send({
        requestId,
        kind,
        payload
      });
    });
  }

  async registerStreamClient(sessionId, client) {
    const nextClients = this.streamClients.get(sessionId) || new Set();
    nextClients.add(client);
    this.streamClients.set(sessionId, nextClients);

    client.onTextMessage = async (raw) => {
      try {
        const payload = JSON.parse(String(raw || '{}'));
        if (payload?.type === 'input') {
          await this.request('session:input', { sessionId, event: payload.event || {} });
          return;
        }

        if (payload?.type === 'activity') {
          await this.request('session:activity', { sessionId, active: payload.active !== false });
        }
      } catch {
        // Ignore malformed stream messages from the browser viewer.
      }
    };

    client.onClose = () => {
      const currentClients = this.streamClients.get(sessionId);
      if (!currentClients) return;
      currentClients.delete(client);
      if (currentClients.size) return;
      this.streamClients.delete(sessionId);
      this.request('session:activity', { sessionId, active: false }).catch(() => {});
    };

    const session = toDecoratedSession(await this.request('session:get', { sessionId }));
    client.sendText(JSON.stringify({
      type: 'state',
      session
    }));

    const frame = await this.request('session:frame', { sessionId }).catch(() => null);
    if (frame?.data) {
      client.sendBinary(Buffer.from(frame.data, 'base64'));
    }

    this.request('session:activity', { sessionId, active: true }).catch(() => {});
  }

  shutdown() {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error('Remote browser worker was shut down.'));
    });
    this.pendingRequests.clear();

    this.streamClients.forEach((clients) => {
      clients.forEach((client) => client.close());
    });
    this.streamClients.clear();

    if (this.worker && !this.worker.killed) {
      this.worker.kill();
    }

    this.worker = null;
    this.readyPromise = null;
    this.resolveReady = null;
    this.rejectReady = null;
  }
}

export function createKDBrowserRemoteHostRouter({ basePath = REMOTE_BROWSER_BASE_PATH } = {}) {
  const service = new KDBrowserRemoteHostService();

  const decoratePayload = (payload) => {
    if (Array.isArray(payload)) {
      return payload.map((item) => toDecoratedSession(item));
    }
    return toDecoratedSession(payload);
  };

  return {
    service,

    async handleHttp(req, res, next = () => {}) {
      const rawUrl = req.url || '/';
      if (!rawUrl.startsWith(basePath)) {
        next();
        return;
      }

      const origin = `http://${req.headers.host || '127.0.0.1:5173'}`;
      const requestUrl = new URL(rawUrl, origin);
      const normalizedPathname = requestUrl.pathname.replace(new RegExp(`^${basePath}`), '') || '/';
      const pathParts = normalizedPathname.split('/').filter(Boolean);

      try {
        if (req.method === 'GET' && normalizedPathname === '/status') {
          const result = await service.request('status');
          sendJson(res, 200, {
            ...result,
            transport: 'chromium-cdp-stream'
          });
          return;
        }

        if (req.method === 'POST' && normalizedPathname === '/sessions') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:create', body));
          sendJson(res, 200, result);
          return;
        }

        if (pathParts[0] !== 'sessions' || !pathParts[1]) {
          sendJson(res, 404, { error: 'Remote browser endpoint not found.' });
          return;
        }

        const sessionId = safeDecode(pathParts[1]);
        const suffix = pathParts.slice(2);

        if (req.method === 'GET' && !suffix.length) {
          const result = decoratePayload(await service.request('session:get', { sessionId }));
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'DELETE' && !suffix.length) {
          const result = await service.request('session:close', { sessionId });
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'GET' && suffix.length === 1 && suffix[0] === 'frame') {
          const frame = await service.request('session:frame', { sessionId });
          const imageBuffer = Buffer.from(frame?.data || '', 'base64');
          res.statusCode = 200;
          res.setHeader('Content-Type', frame?.contentType || 'image/jpeg');
          res.setHeader('Cache-Control', 'no-store');
          res.end(imageBuffer);
          return;
        }

        if (req.method === 'POST' && suffix.length === 1 && suffix[0] === 'navigate') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:navigate', { sessionId, url: body?.url || '' }));
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'POST' && suffix.length === 1 && suffix[0] === 'resize') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:resize', {
            sessionId,
            width: body?.width,
            height: body?.height
          }));
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'POST' && suffix.length === 1 && suffix[0] === 'action') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:action', {
            sessionId,
            action: body?.action || ''
          }));
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'POST' && suffix.length === 1 && suffix[0] === 'input') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:input', {
            sessionId,
            event: body?.event || {}
          }));
          sendJson(res, 200, result);
          return;
        }

        if (req.method === 'POST' && suffix.length === 1 && suffix[0] === 'activity') {
          const body = await readJsonBody(req);
          const result = decoratePayload(await service.request('session:activity', {
            sessionId,
            active: body?.active !== false
          }));
          sendJson(res, 200, result);
          return;
        }

        sendJson(res, 404, { error: 'Remote browser endpoint not found.' });
      } catch (error) {
        const message = toErrorMessage(error);
        const statusCode = /remote browser session not found/i.test(message) ? 404 : 500;
        sendJson(res, statusCode, { error: message });
      }
    },

    async handleUpgrade(req, socket, head) {
      const rawUrl = req.url || '/';
      if (!rawUrl.startsWith(basePath)) return false;

      const origin = `http://${req.headers.host || '127.0.0.1:5173'}`;
      const requestUrl = new URL(rawUrl, origin);
      const normalizedPathname = requestUrl.pathname.replace(new RegExp(`^${basePath}`), '') || '/';
      const pathParts = normalizedPathname.split('/').filter(Boolean);

      if (!(pathParts[0] === 'sessions' && pathParts[1] && pathParts[2] === 'stream')) {
        socket.destroy();
        return true;
      }

      const sessionId = safeDecode(pathParts[1]);
      const connection = acceptWebSocketUpgrade(req, socket, head);
      if (!connection) {
        socket.destroy();
        return true;
      }

      try {
        await service.registerStreamClient(sessionId, connection);
      } catch (error) {
        connection.sendText(JSON.stringify({
          type: 'error',
          error: toErrorMessage(error)
        }));
        connection.close();
      }

      return true;
    },

    shutdown() {
      service.shutdown();
    }
  };
}
