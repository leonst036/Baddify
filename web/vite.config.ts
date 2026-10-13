import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
  plugins: [
    react(),
    {
      name: 'rewrite-login-html',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/login') {
            req.url = '/login/'
          }
          next()
        })
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login/index.html'),
      },
    },
  },
})
