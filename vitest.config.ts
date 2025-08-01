import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
    },
    setupFiles: ['./tests/setup.ts'],
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
