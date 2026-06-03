/**
 * Capture a broad set of noir UI/UX screenshots for visual audit.
 * Run with the dev server up in mock mode:
 *   E2E=1 pnpm dev
 *   pnpm exec tsx scripts/capture-noir-audit.ts
 *
 * Screenshots are written to docs/screenshots/audit/.
 */
import { chromium, type Page } from "playwright";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const OUT_DIR = path.resolve("docs/screenshots/audit");

/** Replace the JSON editor contents so the evidence board renders `data`. */
async function setEditorJSON(page: Page, data: unknown) {
  const editor = page.locator("#json-editor");
  await editor.click();
  // Select-all + delete works cross-platform in the textarea.
  await page.keyboard.press("ControlOrMeta+A");
  await page.keyboard.press("Delete");
  await editor.fill(JSON.stringify(data, null, 2));
  // Let the renderer + typewriter settle.
  await page.waitForTimeout(900);
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: false });
  console.log(`captured: ${name}.png`);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1512, height: 945 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  await page.goto(BASE_URL);
  await page.waitForSelector('[data-testid="desk-layout"]');
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    for (const db of dbs) if (db.name) indexedDB.deleteDatabase(db.name);
  });
  await page.reload();
  await page.waitForSelector('[data-testid="desk-layout"]');
  await page.waitForTimeout(800);

  // 1. Default workspace (full noir frame with ambient effects).
  await shot(page, "01-workspace-default");

  // 2. Dossier card (the signature noir component).
  await setEditorJSON(page, {
    type: "card",
    title: "Subject: V. Sterling",
    description:
      "Last seen 03:14 at the Lux Hotel bar. Known associate of the Marlowe syndicate. Considered evasive.",
    status: "redacted",
  });
  await shot(page, "02-dossier-card");

  // 3. A richer composite case file: heading, callout, table, badges.
  await setEditorJSON(page, {
    type: "column",
    style: { gap: "md" },
    children: [
      { type: "heading", level: 1, text: "Case File #0447" },
      {
        type: "callout",
        content: "Priority lead — corroborated by two witnesses.",
        priority: "high",
      },
      {
        type: "table",
        columns: ["Lead", "Source", "Status"],
        rows: [
          ["Docks rendezvous", "Informant", "Active"],
          ["Forged manifest", "Customs", "Pending"],
          ["Burner phone", "Wiretap", "Closed"],
        ],
      },
      {
        type: "row",
        style: { gap: "sm" },
        children: [
          { type: "badge", label: "CLASSIFIED", variant: "danger" },
          { type: "badge", label: "URGENT", variant: "primary" },
        ],
      },
    ],
  });
  await shot(page, "03-case-file-composite");

  // 4. Stats grid + divider.
  await setEditorJSON(page, {
    type: "column",
    style: { gap: "md" },
    children: [
      { type: "divider", label: "PRECINCT METRICS" },
      {
        type: "grid",
        columns: "3",
        style: { gap: "md" },
        children: [
          { type: "stat", label: "Open Cases", value: "42", helper: "+6 this week" },
          { type: "stat", label: "Solved", value: "38" },
          { type: "stat", label: "Cold", value: "11", helper: "awaiting leads" },
        ],
      },
    ],
  });
  await shot(page, "04-stats-grid");

  // 5. Tabs + form (interactive elements).
  await setEditorJSON(page, {
    type: "tabs",
    tabs: [
      {
        label: "Intake",
        content: {
          type: "column",
          style: { gap: "sm" },
          children: [
            { type: "input", label: "Suspect name", placeholder: "Jane Doe" },
            {
              type: "textarea",
              label: "Statement",
              placeholder: "Where were you at midnight?",
              rows: 3,
            },
            {
              type: "select",
              label: "Priority",
              options: ["Low", "Medium", "High"],
              value: "High",
            },
            { type: "checkbox", label: "Mark as reviewed", checked: true },
            { type: "button", label: "File Report", variant: "primary" },
          ],
        },
      },
      {
        label: "Notes",
        content: { type: "paragraph", text: "No corroborating evidence on record yet." },
      },
    ],
  });
  await shot(page, "05-tabs-form");

  // 6. Image evidence (mock generates a placeholder data URL).
  await setEditorJSON(page, {
    type: "card",
    title: "Surveillance Still",
    description: "Frame 1184 — figure exiting the rear stairwell.",
    status: "active",
  });
  await page.waitForTimeout(400);
  await shot(page, "06-card-active");

  // 7. Chat sidebar closeup (drive a mock exchange first).
  const input = page.locator('input[name="chat-input"]');
  await input.fill("Pull the file on the dockside informant.");
  await input.press("Enter");
  await page.waitForTimeout(1500);
  const sidebar = page.locator('[data-testid="chat-sidebar"]');
  if (await sidebar.isVisible()) {
    await sidebar.screenshot({ path: path.join(OUT_DIR, "07-chat-sidebar.png") });
    console.log("captured: 07-chat-sidebar.png");
  }

  // 8. Reduced-motion variant of the default workspace for comparison.
  const rmContext = await browser.newContext({
    viewport: { width: 1512, height: 945 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const rmPage = await rmContext.newPage();
  await rmPage.goto(BASE_URL);
  await rmPage.waitForSelector('[data-testid="desk-layout"]');
  await rmPage.waitForTimeout(800);
  await rmPage.screenshot({ path: path.join(OUT_DIR, "08-workspace-reduced-motion.png") });
  console.log("captured: 08-workspace-reduced-motion.png");

  await browser.close();
  console.log(`\nAll screenshots in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("capture failed:", err);
  process.exit(1);
});
