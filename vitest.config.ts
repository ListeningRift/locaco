import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'clover', 'json'],
      include: ['src/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': resolve('src'),
    },
  },
})
