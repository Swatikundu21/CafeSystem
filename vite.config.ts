import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function jiraApiPlugin() {
  return {
    name: 'jira-api-dev-middleware',
    configureServer(server: any) {
      server.middlewares.use('/api/jira', (req: any, res: any) => {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
          }
          try {
            const parsed = body ? JSON.parse(body) : {};
            const fakeReq = { method: req.method, body: parsed };
            const fakeRes = {
              status(code: number) {
                res.statusCode = code;
                return this;
              },
              json(data: any) {
                res.end(JSON.stringify(data));
              },
              setHeader(k: string, v: string) {
                res.setHeader(k, v);
              },
              end() {
                res.end();
              },
            };
            const handler = (await import('./api/jira.ts')).default;
            await handler(fakeReq, fakeRes);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message || 'Error processing request' }));
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), jiraApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

