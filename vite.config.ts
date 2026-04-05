import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    "import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA": JSON.stringify(
      process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? "",
    ),
  },
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    sourcemap: true, // required for Sentry source maps
    // Main app chunk is multi‑MB until route-level code splitting; default 500 kB is noisy in CI
    chunkSizeWarningLimit: 5000,
  },
  plugins: [
    react(),
    // Only upload source maps in production builds when auth token is present
    mode === "production" && process.env.SENTRY_AUTH_TOKEN
      ? (() => {
          const releaseName =
            process.env.SENTRY_RELEASE ??
            process.env.VERCEL_GIT_COMMIT_SHA ??
            process.env.GITHUB_SHA;
          return sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            telemetry: false,
            ...(releaseName ? { release: { name: releaseName } } : {}),
          });
        })()
      : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
}));
