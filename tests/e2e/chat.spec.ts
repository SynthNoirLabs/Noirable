import { test, expect } from "@playwright/test";

test("chat command streams a v0.9 surface into the preview", async ({ page }) => {
  await page.goto("/");
  await page.waitForSelector('[data-testid="desk-layout"]');

  const input = page.getByPlaceholder("Type your command...");
  await input.fill(
    'Create a UI card for a missing person with title "Missing: Jane Doe" and description "Last seen near the docks".'
  );
  await input.press("Enter");

  // The app is v0.9-only now: a command opens a surface in the preview pane
  // (the mock stream renders it without an AI provider).
  await page.waitForSelector('[data-testid="a2ui-surface"]', { timeout: 15_000 });
  await expect(page.locator('[data-testid="a2ui-surface"]')).toBeVisible();
});
