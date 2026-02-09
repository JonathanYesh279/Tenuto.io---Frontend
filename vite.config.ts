import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': process.env,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      '@tanstack/react-query',
      'immer',
      'lucide-react',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-select'
    ],
    exclude: [],
    esbuildOptions: {
      target: 'es2020'
    }
  },
  server: {
    port: 5173,
    strictPort: true, // Don't try other ports, fail if 5173 is in use
    host: true,
    open: 'http://localhost:5173',
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true,
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['@headlessui/react', 'lucide-react'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['date-fns', 'clsx', 'tailwind-merge'],
          // Cascade deletion components in separate chunk
          'cascade-deletion': [
            'src/hooks/useCascadeDeletion.ts',
            'src/hooks/useOptimizedCascadeDeletion.ts',
            'src/services/cascadeDeletionService.ts',
            'src/utils/cascadeErrorHandler.ts'
          ]
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('cascade') || facadeModuleId.includes('deletion')) {
              return 'cascade/[name]-[hash].js'
            }
            if (facadeModuleId.includes('worker')) {
              return 'workers/[name]-[hash].js'
            }
          }
          return 'chunks/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'styles/[name]-[hash].css'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      },
    },
    // Performance optimizations
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000, // 1MB warning threshold
  },
})