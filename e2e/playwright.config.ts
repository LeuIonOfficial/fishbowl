import { defineConfig, devices } from '@playwright/test'

// Real-browser e2e: boots the actual server (:3001) and client dev server
// (:5173), then drives multiple browser contexts through a full game.
export default defineConfig({
  testDir: './tests',
  timeout: 150_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
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
})
