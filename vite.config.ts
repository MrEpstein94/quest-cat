import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const buildId = new Date().toISOString();

function buildVersionPlugin(): Plugin {
  const payload = JSON.stringify({ buildId }, null, 2);

  return {
    name: 'quest-cat-build-version',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.end(payload);
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload,
      });
    },
  };
}

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [react(), buildVersionPlugin()],
});
