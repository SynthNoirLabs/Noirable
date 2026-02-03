import { test, expect } from "@playwright/test";

test.describe("Aesthetic System", () => {
  test("starts with noir aesthetic by default", async ({ page }) => {
    await page.goto("/");

    // Verify the data-aesthetic attribute is set to noir by default
    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "noir");
  });

  test("CSS variables are applied based on aesthetic", async ({ page }) => {
    await page.goto("/");

    // Verify CSS variables are defined on the root element
    const rootElement = page.locator("[data-aesthetic='noir']");
    await expect(rootElement).toBeVisible();

    // Check that aesthetic-related CSS variables resolve to actual values
    const backgroundColor = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      const styles = getComputedStyle(el);
      return styles.getPropertyValue("--aesthetic-background").trim();
    });

    // Noir theme should have a dark background color defined
    expect(backgroundColor).toBeTruthy();
    expect(backgroundColor).not.toBe("");
  });

  test("aesthetic system elements render correctly", async ({ page }) => {
    await page.goto("/");

    // Wait for the page to fully load
    await page.waitForLoadState("networkidle");

    // Verify the main workspace layout is visible
    const workspace = page.locator("[data-aesthetic]");
    await expect(workspace).toBeVisible();

    // Verify the chat sidebar is present (uses aesthetic variables)
    const chatInput = page.getByPlaceholder("Type your command...");
    await expect(chatInput).toBeVisible();
  });
});
