import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    hookTimeout: 10_000,
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reportsDirectory: "reports/coverage",
      reporter: ["text", "json-summary", "lcov"],
      include: ["src/**/*.ts"],
      // Bootstrap and transports are exercised by child-process E2E tests,
      // whose V8 coverage is not observable from the parent Vitest process.
      exclude: ["src/index.ts", "src/transports/**"],
      thresholds: {
        branches: 75,
        functions: 95,
        lines: 90,
        statements: 90,
      },
    },
  },
});
