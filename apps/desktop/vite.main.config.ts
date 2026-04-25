import { builtinModules } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const external = ['electron', ...builtinModules, ...builtinModules.map((moduleName) => `node:${moduleName}`)]

export default defineConfig({
  root: rootDir,
  build: {
    emptyOutDir: true,
    lib: {
      entry: path.resolve(rootDir, 'src/main/main.ts'),
      fileName: () => 'main.js',
      formats: ['es'],
    },
    minify: false,
    outDir: path.resolve(rootDir, 'dist'),
    rollupOptions: {
      external,
      output: {
        chunkFileNames: 'chunks/[name]-[hash].js',
      },
    },
    sourcemap: true,
    target: 'node22',
  },
})
