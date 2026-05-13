import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Dev-only middleware that exposes /api/agent locally so `npm run dev`
 * works without `vercel dev`. In production the Vercel Function at
 * /api/agent.ts handles the same route.
 */
function devAgentRoute(env: Record<string, string>): Plugin {
  return {
    name: 'blockbuilders-dev-agent',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/agent', async (req, res) => {
        const r = req as IncomingMessage;
        const w = res as ServerResponse;
        if (r.method !== 'POST') {
          w.statusCode = 405;
          w.setHeader('content-type', 'application/json');
          w.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        const chunks: Buffer[] = [];
        for await (const chunk of r) {
          chunks.push(chunk as Buffer);
        }
        const raw = Buffer.concat(chunks).toString('utf8');

        let body: { prompt?: string; world?: unknown };
        try {
          body = JSON.parse(raw);
        } catch {
          w.statusCode = 400;
          w.setHeader('content-type', 'application/json');
          w.end(JSON.stringify({ error: 'Invalid JSON' }));
          return;
        }

        try {
          // Lazy-import the runner so dev doesn't pull these into the
          // client bundle if the route is never hit.
          const { runAgent } = await import('./src/agent/runAgent');
          const result = await runAgent(
            { prompt: body.prompt ?? '', world: (body.world as never) ?? [] },
            { apiKey: env.GEMINI_API_KEY ?? '' }
          );
          w.statusCode = 200;
          w.setHeader('content-type', 'application/json');
          w.end(JSON.stringify(result));
        } catch (err) {
          w.statusCode = 500;
          w.setHeader('content-type', 'application/json');
          w.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : String(err),
            })
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), devAgentRoute(env)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('three') || id.includes('@react-three')) return 'three';
            if (id.includes('@mysten')) return 'sui';
            if (id.includes('@tanstack/react-query')) return 'query';
            if (
              id.includes('react') ||
              id.includes('zustand') ||
              id.includes('mitt') ||
              id.includes('zod')
            ) {
              return 'vendor';
            }
            return undefined;
          },
        },
      },
    },
  };
});
