import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}"],
    exclude: [...configDefaults.exclude],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/**"],
    },
  },
});
