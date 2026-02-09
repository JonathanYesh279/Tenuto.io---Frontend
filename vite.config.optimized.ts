import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import compression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    // Add bundle analysis
    visualizer({
      open: false,
      filename: 'dist/bundle-analysis.html',
      gzipSize: true,
      brotliSize: true
    }),
    // Add gzip/brotli compression
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Replace moment with date-fns
      'moment': 'date-fns'
    },
  },
  
  define: {
    'process.env': process.env,
  },
  
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    open: 'http://localhost:5173',
    watch: {
      usePolling: true,
      interval: 300,
    },
    hmr: {
      overlay: true,
    },
  },
  
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable in production for smaller builds
    
    // Optimize chunk size
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // Advanced code splitting strategy
        manualChunks: (id) => {
          // Core vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('react-router')) {
              return 'router'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query'
            }
            if (id.includes('chart.js') || id.includes('react-chartjs')) {
              return 'charts'
            }
            if (id.includes('xlsx')) {
              return 'excel'
            }
            if (id.includes('jspdf')) {
              return 'pdf'
            }
            if (id.includes('react-big-calendar') || id.includes('moment')) {
              return 'calendar'
            }
            if (id.includes('date-fns')) {
              return 'date-utils'
            }
            if (id.includes('@headlessui') || id.includes('lucide-react') || id.includes('@floating-ui')) {
              return 'ui-components'
            }
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'forms'
            }
            if (id.includes('framer-motion')) {
              return 'animation'
            }
            if (id.includes('react-window') || id.includes('react-virtualized')) {
              return 'virtualization'
            }
            // All other vendor modules
            return 'vendor'
          }
          
          // Application code splitting
          if (id.includes('src/features/students')) {
            return 'students-feature'
          }
          if (id.includes('src/features/teachers')) {
            return 'teachers-feature'
          }
          if (id.includes('src/features/orchestras')) {
            return 'orchestras-feature'
          }
          if (id.includes('src/components/forms')) {
            return 'forms-components'
          }
          if (id.includes('src/components/charts') || id.includes('src/components/analytics')) {
            return 'analytics-components'
          }
          if (id.includes('src/services')) {
            return 'services'
          }
        },
        
        // Asset optimization
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      },
      
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    
    // Asset inlining threshold
    assetsInlineLimit: 4096, // 4kb
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'date-fns',
      'zustand'
    ],
    exclude: [
      // Heavy libraries that should be dynamically imported
      'chart.js',
      'react-chartjs-2',
      'xlsx',
      'jspdf',
      'jspdf-autotable',
      'react-big-calendar'
    ]
  }
})