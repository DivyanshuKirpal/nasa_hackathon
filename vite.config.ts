/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleGuidanceNode } from './server/groq.js'

/**
 * Mounts the Groq guidance proxy at /api/guidance on the dev and preview
 * servers, so the API key from .env.local stays on the server. On Vercel the
 * same handler runs as api/guidance.js.
 */
function guidanceApi(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'crew-guidance-api',
    configureServer(server) {
      server.middlewares.use('/api/guidance', (req, res) => {
        void handleGuidanceNode(req, res, env)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/guidance', (req, res) => {
        void handleGuidanceNode(req, res, env)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // '' loads every variable, not only VITE_ ones; none of them reach the bundle.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  return {
    plugins: [react(), tailwindcss(), guidanceApi(env)],
    build: {
      rollupOptions: {
        output: {
          // three.js loads only when the 3D body is turned on; a named chunk
          // makes that easy to see in the build output (section 22.8).
          manualChunks(id: string) {
            return id.includes('/node_modules/three/') ? 'three' : undefined
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
