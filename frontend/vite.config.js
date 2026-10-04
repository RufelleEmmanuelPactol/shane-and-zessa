import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// In dev, Vite serves the page and forwards /api to Django on :8000.
// Builds default to a plain static site; when Django serves the build it is
// made with VITE_BASE=/static/ (see Dockerfile.django).
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? (process.env.VITE_BASE || '/') : '/',
  server: {
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
}))
