import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
const project = fileURLToPath(new URL('../../', import.meta.url))
const fixture = (name: string) => fileURLToPath(new URL(name, import.meta.url))
export default defineConfig({
  root: fixture('.'),
  publicDir: project + 'public',
  resolve: {
    alias: [
      { find: 'next/navigation', replacement: fixture('./navigation.ts') },
      { find: 'next/dynamic', replacement: fixture('./dynamic.tsx') },
      { find: '@/actions/image-actions', replacement: fixture('./actions.ts') },
      { find: '@/actions/history-actions', replacement: fixture('./actions.ts') },
      { find: '@', replacement: project },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    fs: { allow: [project] },
    watch: { usePolling: true },
  },
})
