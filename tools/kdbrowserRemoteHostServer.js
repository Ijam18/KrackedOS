import http from 'node:http';
import { createKDBrowserRemoteHostRouter } from './kdbrowserRemoteHostRouter.js';

const port = Number(process.env.KDBROWSER_REMOTE_PORT || 5174);
const host = process.env.KDBROWSER_REMOTE_HOST || '127.0.0.1';
const router = createKDBrowserRemoteHostRouter();

const server = http.createServer((req, res) => {
  router.handleHttp(req, res, () => {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Remote browser endpoint not found.' }));
  }).catch((error) => {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : 'Remote browser host failed.'
    }));
  });
});

server.on('upgrade', (req, socket, head) => {
  router.handleUpgrade(req, socket, head).catch(() => {
    socket.destroy();
  });
});

server.on('close', () => {
  router.shutdown();
});

server.listen(port, host, () => {
  process.stdout.write(`KD browser host listening on http://${host}:${port}\n`);
});
