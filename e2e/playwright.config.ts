import { defineConfig, devices } from '@playwright/test'

// Real-browser e2e. Two modes:
//   • local  (default): boots the server (:3001) + client dev (:5173) and tests those.
//   • live   (BASE_URL set): tests an already-running deployment, e.g.
//             BASE_URL=https://game.ionleu.com npm test
const BASE_URL = process.env.BASE_URL
const isLive = !!BASE_URL

export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI || isLive ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    // SLOWMO=300 slows each action so you can follow along when running --headed.
    launchOptions: { slowMo: Number(process.env.SLOWMO) || 0 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Only spin up local servers when not targeting a live deployment.
  ...(isLive
    ? {}
    : {
        webServer: [
          {
            command: 'npm --prefix ../server start',
            port: 3001,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
          {
            command: 'npm --prefix ../client run dev',
            port: 5173,
            reuseExistingServer: !process.env.CI,
            timeout: 60_000,
          },
        ],
      }),
})
