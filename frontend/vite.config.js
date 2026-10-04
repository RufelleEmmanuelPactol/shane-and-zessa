import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, Vite serves the page and forwards /api to Django on :8000.
// In production, Django serves the built files from dist/ under /static/.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/static/' : '/',
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
}))
