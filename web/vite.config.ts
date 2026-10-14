import { readFileSync } from 'fs'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function isAllowedRoute(pathname: string): boolean {
  if (pathname === '/' || pathname === '/index.html') return true
  if (pathname === '/login' || pathname === '/login/' || pathname === '/login/index.html') return true
  if (pathname === '/register' || pathname === '/register/') return true
  return false
}

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
          if (req.url === '/register' || req.url === '/register/') {
            _res.statusCode = 302
            _res.setHeader('Location', '/login/#signup')
            _res.end()
            return
          }
          next()
        })

        // Return post-hook to serve 404 page for unhandled or rewritten requests
        return () => {
          server.middlewares.use(async (req, res, next) => {
            const originalPath = new URL(req.originalUrl || req.url || '/', 'http://localhost').pathname
            if (!isAllowedRoute(originalPath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              const notFoundPath = resolve(import.meta.dirname, 'src/404.html')
              const html = readFileSync(notFoundPath, 'utf-8')
              const transformed = await server.transformIndexHtml(req.originalUrl || '/404.html', html)
              res.end(transformed)
              return
            }
            next()
          })
        }
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/login') {
            req.url = '/login/'
          }
          if (req.url === '/register' || req.url === '/register/') {
            res.statusCode = 302
            res.setHeader('Location', '/login/#signup')
            res.end()
            return
          }
          next()
        })

        return () => {
          server.middlewares.use((req, res, next) => {
            const originalPath = new URL(req.originalUrl || req.url || '/', 'http://localhost').pathname
            if (!isAllowedRoute(originalPath)) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'text/html; charset=utf-8')
              const notFoundPath = resolve(import.meta.dirname, 'src/404.html')
              const html = readFileSync(notFoundPath, 'utf-8')
              res.end(html)
              return
            }
            next()
          })
        }
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        login: resolve(import.meta.dirname, 'login/index.html'),
        notFound: resolve(import.meta.dirname, 'src/404.html'),
      },
    },
  },
})

