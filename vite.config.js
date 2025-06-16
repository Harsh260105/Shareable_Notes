import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Define environment variable handling
  envPrefix: 'VITE_',
  // Environment variables prefixed with VITE_ are automatically exposed
})
