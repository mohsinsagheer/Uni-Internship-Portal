import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // Raise chunk size warning limit to suppress noise; real splits are handled below
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Manual chunk splitting to separate heavy dependencies from app code
        manualChunks(id) {
          // Firebase – split into its own chunk (async loaded after auth)
          if (id.includes('node_modules/firebase')) {
            return 'firebase';
          }
          // mammoth – large DOCX parser only used in DocumentViewerModal (lazy)
          if (id.includes('node_modules/mammoth')) {
            return 'mammoth';
          }
          // lucide-react icon tree – separate vendor chunk
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          // canvas-confetti – only used occasionally
          if (id.includes('node_modules/canvas-confetti')) {
            return 'confetti';
          }
          // Everything else in node_modules goes to 'vendor'
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Use content-hash filenames for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
