import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    proxy: {
      '/api': {
        target: 'http://18.191.184.84',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            const currentTenant = req.headers['x-tenant'] as string || 'empresa1'
            const tenantDomain = `${currentTenant}.midominio.com`
            proxyReq.setHeader('Host', tenantDomain)
          })
        }
      }
    }
  }
})
