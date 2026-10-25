import { defineConfig } from "vitest/config";
import { CONTENT_SECURITY_POLICY } from "./src/security/csp";

export default defineConfig({
  // Relative base so the page works under the GitHub Pages sub-path.
  base: "./",
  plugins: [
    {
      // Only on build: the dev server needs its own live-reload connection.
      name: "content-security-policy",
      apply: "build",
      transformIndexHtml: () => [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
          injectTo: "head-prepend",
        },
      ],
    },
  ],
  test: {
    environment: "jsdom",
  },
});
