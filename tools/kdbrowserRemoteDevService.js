import { createKDBrowserRemoteHostRouter } from './kdbrowserRemoteHostRouter.js';

export function kdbrowserRemoteDevPlugin() {
  const router = createKDBrowserRemoteHostRouter();

  return {
    name: 'kdbrowser-remote-dev',
    configureServer(server) {
      server.httpServer?.once('close', () => {
        router.shutdown();
      });

      server.httpServer?.on('upgrade', (req, socket, head) => {
        router.handleUpgrade(req, socket, head).catch(() => {
          socket.destroy();
        });
      });

      server.middlewares.use((req, res, next) => {
        router.handleHttp(req, res, next).catch((error) => {
          next(error);
        });
      });
    }
  };
}
