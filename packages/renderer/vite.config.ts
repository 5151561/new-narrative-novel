import path from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { getRendererAssetBase } from './vite-base'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ command }) => ({
  base: getRendererAssetBase(command),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'src'),
    },
  },
}))
