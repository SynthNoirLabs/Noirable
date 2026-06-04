/**
 * Capture verification screenshots after the v0.9 feature work.
 * Run with the dev server up (E2E=1 pnpm dev), then:
 *   npx tsx scripts/capture-v09.ts
 *
 * Captures:
 *  - workspace.png     — main detective desk loads
 *  - gallery.png       — every catalog component + variants in one surface
 *  - harness-initial   — the v0.9 harness with all 18-component features
 *  - harness-validated — after an invalid email (validation error visible)
 *  - harness-action    — after the server-action round-trip updates /status
 */
import { chromium, type Page } from "playwright";
import path from "path";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("docs/screenshots/v09-verify");

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`Captured: ${name}.png`);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();

  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

  // 1. Main workspace still loads.
  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="desk-layout"]');
  await page.waitForTimeout(500);
  await shot(page, "workspace");

  // 2. The component gallery — every catalog component in one surface (full page).
  await page.goto(`${BASE_URL}/a2ui-gallery`);
  await page.waitForSelector('[data-testid="a2ui-gallery"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT_DIR, "gallery.png"), fullPage: true });
  console.log("Captured: gallery.png");

  // 3. The v0.9 harness — every new feature in one surface.
  await page.goto(`${BASE_URL}/a2ui-harness`);
  await page.waitForSelector('[data-testid="a2ui-harness"]');
  await page.waitForTimeout(400);
  await shot(page, "harness-initial");

  // 4. Validation: type a bad email and blur → inline error.
  const email = page.getByLabel("Contact email");
  await email.fill("not-an-email");
  await email.blur();
  await page.waitForTimeout(200);
  await shot(page, "harness-validated");

  // 5. Server-action round-trip: click the button → /status updates.
  await page.getByRole("button", { name: "File the case" }).click();
  await page.getByText("Submitted: submit").waitFor({ timeout: 5000 });
  await page.waitForTimeout(200);
  await shot(page, "harness-action");

  await browser.close();

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} console error(s) during capture:`);
    for (const e of errors.slice(0, 10)) console.log(`  - ${e}`);
  } else {
    console.log("\n✓ No console errors during capture.");
  }
  console.log(`\nScreenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("Capture failed:", err);
  process.exit(1);
});
