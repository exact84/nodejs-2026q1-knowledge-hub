import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      src: resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.spec.ts'],
    exclude: ['test/**', 'dist/**', 'node_modules/**'],
    setupFiles: ['vitest.setup.ts'],
    coverage: {
      thresholds: {
        lines: 90,
        branches: 85,
      },
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'src/auth/**/*.service.ts',
        'src/users/*.service.ts',
        'src/articles/*.service.ts',
        'src/**/*.dto.ts',
        'src/**/*.guard.ts',
        'src/**/*.interceptor.ts',
        'src/**/*.filter.ts',
      ],
      exclude: ['src/**/*.spec.ts', 'src/prisma/**'],
    },
  },
});
