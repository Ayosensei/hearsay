import { defineConfig } from "vitest/config";
export default defineConfig({
  test: { fileParallelism: false, hookTimeout: 30000, testTimeout: 15000 },
});
