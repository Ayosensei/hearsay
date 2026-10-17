import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration files share one local server; explicit in-test concurrency remains enabled.
    fileParallelism: false,
    hookTimeout: 30000,
  },
});
