import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Dev-only middleware mounting /api/agent and /api/tutor locally so
 * `npm run dev` works without `vercel dev`. In production the Vercel
 * Functions at api/agent.ts + api/tutor.ts handle the same routes.
 */
function devAgentRoute(env: Record<string, string>): Plugin {
  return {
    name: 'blockbuilders-dev-agent',
    apply: 'serve',
    configureServer(server) {
      const readBody = async (r: IncomingMessage): Promise<unknown> => {
        const chunks: Buffer[] = [];
        for await (const chunk of r) chunks.push(chunk as Buffer);
        return JSON.parse(Buffer.concat(chunks).toString('utf8'));
      };

      const writeJSON = (w: ServerResponse, status: number, payload: unknown) => {
        w.statusCode = status;
        w.setHeader('content-type', 'application/json');
        w.end(JSON.stringify(payload));
      };

      server.middlewares.use('/api/agent', async (req, res) => {
        const r = req as IncomingMessage;
        const w = res as ServerResponse;
        if (r.method !== 'POST') return writeJSON(w, 405, { error: 'Method not allowed' });
        let body: { prompt?: string; world?: unknown };
        try {
          body = (await readBody(r)) as typeof body;
        } catch {
          return writeJSON(w, 400, { error: 'Invalid JSON' });
        }
        try {
          const { runAgent } = await import('./src/agent/runAgent');
          const result = await runAgent(
            { prompt: body.prompt ?? '', world: (body.world as never) ?? [] },
            { apiKey: env.GEMINI_API_KEY ?? '' }
          );
          writeJSON(w, 200, result);
        } catch (err) {
          writeJSON(w, 500, { error: err instanceof Error ? err.message : String(err) });
        }
      });

      server.middlewares.use('/api/tutor', async (req, res) => {
        const r = req as IncomingMessage;
        const w = res as ServerResponse;
        if (r.method !== 'POST') return writeJSON(w, 405, { error: 'Method not allowed' });
        let body: { topic?: string; heading?: string; body?: string };
        try {
          body = (await readBody(r)) as typeof body;
        } catch {
          return writeJSON(w, 400, { error: 'Invalid JSON' });
        }
        if (!body.topic || !body.heading || !body.body) {
          return writeJSON(w, 400, { error: 'topic, heading, body required' });
        }
        try {
          const { runTutor } = await import('./src/agent/runTutor');
          const result = await runTutor(
            { topic: body.topic, heading: body.heading, body: body.body },
            { apiKey: env.GEMINI_API_KEY ?? '' }
          );
          writeJSON(w, 200, result);
        } catch (err) {
          writeJSON(w, 500, { error: err instanceof Error ? err.message : String(err) });
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
