import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: rootDir,
  build: {
    emptyOutDir: false,
    lib: {
      entry: path.resolve(rootDir, 'src/preload/index.ts'),
      fileName: () => 'preload.cjs',
      formats: ['cjs'],
    },
    minify: false,
    outDir: path.resolve(rootDir, 'dist'),
    rollupOptions: {
      external: ['electron'],
    },
    sourcemap: true,
    target: 'node22',
  },
})
