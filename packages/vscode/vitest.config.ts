import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@otel-log-beautifier/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
