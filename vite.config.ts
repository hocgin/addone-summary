import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest })
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup.html',
        background: 'src/background.ts',
        offscreen: 'src/offscreen.html',
        'content-script': 'src/content-scripts/extractor.ts',
        onboarding: 'src/onboarding.html'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    }
  }
})
