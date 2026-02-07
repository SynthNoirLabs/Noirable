/**
 * Take README screenshots using Playwright.
 * Run: npx tsx scripts/take-screenshots.ts
 *
 * Requires E2E=1 so the app uses mock providers.
 * Start dev server first: E2E=1 pnpm dev
 */
import { chromium } from "playwright";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("docs/screenshots");

/** Type a message into the chat input and submit it. */
async function sendChat(page: import("playwright").Page, message: string) {
  const input = page.locator('input[name="chat-input"]');
  await input.fill(message);
  await input.press("Enter");
}

/** Wait for n assistant messages to appear in the chat sidebar. */
async function waitForAssistantMessages(page: import("playwright").Page, count: number) {
  // The evidence stamp appears once a component renders on the board
  await page.waitForSelector('[data-testid="evidence-stamp"]', { timeout: 10_000 });
  // Give the UI a moment to finish animations
  await page.waitForTimeout(800);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="desk-layout"]');

  // Clear all persisted state so we start fresh
  await page.evaluate(async () => {
    localStorage.clear();
    // Also clear IndexedDB
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) indexedDB.deleteDatabase(db.name);
    }
  });
  await page.reload();
  await page.waitForSelector('[data-testid="desk-layout"]');
  await page.waitForTimeout(500);

  // 1. Send an image prompt so the board shows a suspect photo
  await sendChat(page, "Generate a photo of the suspect last seen near the docks");
  await waitForAssistantMessages(page, 1);

  // Capture workspace with generated component visible
  await page.screenshot({ path: path.join(OUT_DIR, "workspace.png"), fullPage: false });
  console.log("Captured: workspace.png");

  // 2. Send a second message to add a table component
  await sendChat(page, "Show me a table of all leads");
  await page.waitForTimeout(2000);

  // Capture the evidence board with multiple components
  await page.screenshot({ path: path.join(OUT_DIR, "evidence-board.png"), fullPage: false });
  console.log("Captured: evidence-board.png");

  // 3. Chat sidebar closeup
  const sidebar = page.locator('[data-testid="chat-sidebar"]');
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
