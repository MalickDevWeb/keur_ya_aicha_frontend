import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

const FALLBACK_BACKEND_ORIGIN = 'https://bakend-next-saas-gestion-client.onrender.com'

function normalizeProxyTarget(value: string | undefined): string {
  const raw = String(value || '').trim()
  if (!raw) return FALLBACK_BACKEND_ORIGIN

  try {
    const parsed = new URL(raw)
    const normalizedPath = String(parsed.pathname || '').replace(/\/+$/, '')
    if (normalizedPath === '/api') {
      parsed.pathname = ''
    }
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/+$/, '')
  } catch {
    return FALLBACK_BACKEND_ORIGIN
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const proxyTarget = normalizeProxyTarget(process.env.VITE_API_URL)

  return {
    server: {
      host: '::',
      port: 5173,
      strictPort: false, // Fallback to next available port if 5173 is in use
      hmr: {
        overlay: false,
      },
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            pdf: ['jspdf', 'html2canvas'],
            excel: ['exceljs'],
          },
        },
      },
    },
  }
})
