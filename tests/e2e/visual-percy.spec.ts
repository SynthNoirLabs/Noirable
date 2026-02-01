import { test } from "@playwright/test";
import percySnapshot from "@percy/playwright";

/**
 * Percy visual regression tests.
 *
 * These tests upload screenshots to Percy's cloud for AI-powered visual comparison.
 * Run with: PERCY_TOKEN=xxx pnpm e2e:percy
 *
 * Percy's "layout" mode focuses on structural changes, ignoring minor text/color diffs.
 */

test.describe("Percy Visual Tests", () => {
  test("homepage - full layout", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    // Wait for hydration and fonts
    await page.waitForTimeout(1000);

    await percySnapshot(page, "Homepage - Default Layout", {
      widths: [1280, 1920],
      minHeight: 1024,
    });
  });

  test("homepage - with editor hidden", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Hide the editor
    const hideButton = page.getByRole("button", { name: /hide editor/i });
    if (await hideButton.isVisible()) {
      await hideButton.click();
      await page.waitForTimeout(500);

      await percySnapshot(page, "Homepage - Editor Hidden", {
        widths: [1280],
        minHeight: 1024,
      });
    }
  });

  test("homepage - mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.waitForTimeout(1000);

    await percySnapshot(page, "Homepage - Mobile", {
      widths: [375],
      minHeight: 812,
    });
  });

  test("homepage - tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.waitForTimeout(1000);

    await percySnapshot(page, "Homepage - Tablet", {
      widths: [768],
      minHeight: 1024,
    });
  });
});
