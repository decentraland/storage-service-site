/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vitejs.dev/config/
// eslint-disable-next-line import/no-default-export
export default defineConfig(({ command, mode }) => {
  const envVariables = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    ...(command === 'build' ? { base: envVariables.VITE_BASE_URL } : undefined),
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html']
      },
      server: {
        deps: {
          inline: ['decentraland-ui2', '@dcl/hooks', '@dcl/ui-env', '@dcl/schemas']
        }
      }
    },
    server: {
      proxy: {
        '/auth': {
          target: 'https://decentraland.zone/auth',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/auth/, '')
        }
      }
    }
  }
})
