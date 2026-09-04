import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://tauri.app/start/frontend/vite/
export default defineConfig(async () => ({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: false,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? ('chrome105' as const) : ('safari14.1' as const),
    minify: !process.env.TAURI_ENV_DEBUG ? ('esbuild' as const) : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}))
