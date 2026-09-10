/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/keycloak': {
        target: 'https://keycloak.4fdevelopers.com.br',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/keycloak/, '')
      }
    }
  },
  test: {
    environment: 'jsdom',
  },
})
