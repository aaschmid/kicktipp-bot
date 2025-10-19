import { coverageConfigDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    mockReset: true,
    clearMocks: true,

    environment: "node",

    typecheck: {
      tsconfig: "./tsconfig.json",
    },

    coverage: {
      exclude: [...coverageConfigDefaults.exclude],
      provider: "istanbul",
      reporter: ["cobertura", "text"],
      reportsDirectory: "<rootDir>/../build/coverage",
    },
  },
});
