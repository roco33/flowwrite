import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.ts'],
  },
  resolve: {
    alias: {
      $src: resolve(__dirname, 'src'),
    },
  },
})
