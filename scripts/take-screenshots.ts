/**
 * Take README screenshots using Playwright.
 * Run: pnpm exec playwright test scripts/take-screenshots.ts
 * Or directly: npx tsx scripts/take-screenshots.ts
 *
 * Requires E2E=1 so the app uses mock providers.
 */
import { chromium } from "playwright";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("docs/screenshots");

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  // 1. Full workspace
  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="desk-layout"]');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT_DIR, "workspace.png"), fullPage: false });
  console.log("Captured: workspace.png");

  // 2. Send a message to get a UI component on the board
  const input = page.locator('input[type="text"], textarea').first();
  if (await input.isVisible()) {
    await input.fill("Create a missing person card for Jane Doe last seen at the docks");
    await input.press("Enter");
    // Wait for the AI response to render
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, "evidence-board.png"), fullPage: false });
    console.log("Captured: evidence-board.png");
  }

  // 3. Chat sidebar closeup
  const sidebar = page.locator('[data-testid="chat-sidebar"]').first();
  if (await sidebar.isVisible()) {
    await sidebar.screenshot({ path: path.join(OUT_DIR, "chat-sidebar.png") });
    console.log("Captured: chat-sidebar.png");
  }

  await browser.close();
  console.log(`Screenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
