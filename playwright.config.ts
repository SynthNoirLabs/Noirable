import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  // `next dev` compiles each route on first request, so the first spec to hit a
  // route pays the compile cost; give CI extra per-test headroom for that.
  timeout: process.env.CI ? 120_000 : 60_000,
  // Retry in CI to absorb cold-compile timing flakes (the first hit to a route
  // can be slow on a fresh dev server); a real failure still fails all attempts.
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    // Locally reuse an already-running dev server; in CI always boot a fresh one
    // and wait for it (reusing would skip the readiness wait and race the suite).
    reuseExistingServer: !process.env.CI,
    // `next dev` compiles routes on first hit, so a cold CI runner needs ample
    // headroom for the server to become ready before the suite starts.
    timeout: process.env.CI ? 240_000 : 120_000,
    env: {
      E2E: "1",
    },
  },
});
