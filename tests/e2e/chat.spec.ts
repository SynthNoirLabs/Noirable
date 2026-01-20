import { test, expect } from "@playwright/test";

test("chat triggers generate_ui and renders evidence", async ({ page }) => {
  await page.goto("/");

  const input = page.getByPlaceholder("Type your command...");
  await input.fill(
    'Create a UI card for a missing person with title "Missing: Jane Doe" and description "Last seen near the docks".',
  );
  await input.press("Enter");

  const jsonEditor = page.locator("textarea").first();
  await expect(jsonEditor).toHaveValue(/"title": "Missing: Jane Doe"/);
});
