import { defineConfig } from "vitest/config";

export default defineConfig({
  // Relative base so the page works under the GitHub Pages sub-path.
  base: "./",
  test: {
    environment: "jsdom",
    passWithNoTests: true,
  },
});
