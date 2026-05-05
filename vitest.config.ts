import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/__tests__/**',
        'src/server.ts',
        'src/types/**',
        // env.ts is tested via schema-level tests (vi.mock prevents direct coverage)
        'src/config/env.ts',
        // permissions.ts is a pure data definition, no logic to test
        'src/config/permissions.ts',
      ],
      thresholds: {
        lines: 75,
        functions: 65,
        branches: 75,
        statements: 75,
      },
    },
  },
});
