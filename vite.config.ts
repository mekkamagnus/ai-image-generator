import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    // Base path for production deployment (default: '/')
    base: '/',

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },

    build: {
      outDir: 'dist',
      // Improve caching with manual chunks
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom'],
            'pocketbase': ['pocketbase']
          }
        }
      }
    },

    // Preview server configuration for testing production builds
    preview: {
      port: 4173,
      host: true
    },

    server: {
      allowedHosts: [
        'mekkapi.local'
      ],
      proxy: {
        // Proxy for generating images (development only)
        '/api/qwen': {
          target: 'https://dashscope.aliyuncs.com/api/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/qwen/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.setHeader('Authorization', `Bearer ${env.DASHSCOPE_API_KEY}`)
              // Note: Async mode not supported by current API account
              // Using synchronous mode instead
            })
          }
        }
      }
    }
  }
})
