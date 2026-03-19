import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import searchIndexPlugin from './vite-plugin-search-index'

export default defineConfig({
  plugins: [react(), tailwindcss(), searchIndexPlugin()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
