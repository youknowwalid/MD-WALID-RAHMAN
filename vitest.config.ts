import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/db/**/*.test.ts', 'tests/unit/**/*.test.ts'], testTimeout: 30000 },
});
