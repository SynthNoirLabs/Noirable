import { test, expect } from "@playwright/test";

/**
 * Visual regression and layout tests for bmad.
 *
 * These tests catch:
 * 1. Visual regressions (screenshot comparison)
 * 2. CSS not applied correctly (toHaveCSS)
 * 3. Elements piled up / wrong positions (bounding box assertions)
 */

test.describe("Layout Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for hydration and initial render
    await page.waitForSelector('[data-testid="desk-layout"]');
    // Wait for fonts and animations to settle
    await page.waitForTimeout(500);
  });

  test("homepage layout matches snapshot", async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.emulateMedia({ reducedMotion: "reduce" });

    await expect(page).toHaveScreenshot("homepage-layout.png", {
      maxDiffPixels: 200, // Allow minor rendering differences
      threshold: 0.2, // 20% pixel difference threshold
    });
  });

  test("layout renders with correct grid structure", async ({ page }) => {
    const layout = page.locator('[data-testid="desk-layout"]');

    // Grid should be applied
    await expect(layout).toHaveCSS("display", "grid");

    // Grid gap should be 0 or "normal" (both mean no gap in this context)
    const gap = await layout.evaluate((el) => window.getComputedStyle(el).gap);
    expect(["0px", "normal", "0px 0px"]).toContain(gap);
  });

  test("three-column layout has correct proportions", async ({ page }) => {
    const editor = page.locator('[data-testid="editor-pane"]');
    const board = page.locator('[data-testid="evidence-board"]');
    const sidebar = page.locator('[data-testid="chat-sidebar"]');

    // All three panels should be visible
    await expect(editor).toBeVisible();
    await expect(board).toBeVisible();
    await expect(sidebar).toBeVisible();

    // Get bounding boxes
    const editorBox = await editor.boundingBox();
    const boardBox = await board.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    // All should have valid dimensions
    expect(editorBox).not.toBeNull();
    expect(boardBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();

    // Panels should be horizontally ordered: editor < board < sidebar
    expect(editorBox!.x).toBeLessThan(boardBox!.x);
    expect(boardBox!.x).toBeLessThan(sidebarBox!.x);

    // Minimum width assertions (catches "collapsed to 0" bugs)
    expect(editorBox!.width).toBeGreaterThan(150);
    expect(boardBox!.width).toBeGreaterThan(200);
    expect(sidebarBox!.width).toBeGreaterThan(150);

    // Height should span viewport (not collapsed)
    expect(editorBox!.height).toBeGreaterThan(400);
    expect(boardBox!.height).toBeGreaterThan(400);
    expect(sidebarBox!.height).toBeGreaterThan(400);
  });

  test("elements are not piled up at origin", async ({ page }) => {
    const editor = page.locator('[data-testid="editor-pane"]');
    const board = page.locator('[data-testid="evidence-board"]');
    const sidebar = page.locator('[data-testid="chat-sidebar"]');

    const editorBox = await editor.boundingBox();
    const boardBox = await board.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    // Collect X positions
    const xPositions = [editorBox!.x, boardBox!.x, sidebarBox!.x];

    // At least 2 unique X positions (catches "all piled at x=0")
    const uniqueX = new Set(xPositions.map((x) => Math.round(x)));
    expect(
      uniqueX.size,
      `Elements piled up horizontally: X positions are ${xPositions.join(", ")}`
    ).toBeGreaterThanOrEqual(2);

    // Board and sidebar should NOT be at x=0
    expect(boardBox!.x, "Evidence board should not be at x=0").toBeGreaterThan(50);
    expect(sidebarBox!.x, "Sidebar should not be at x=0").toBeGreaterThan(100);
  });

  test("panels do not overlap", async ({ page }) => {
    const editor = page.locator('[data-testid="editor-pane"]');
    const board = page.locator('[data-testid="evidence-board"]');
    const sidebar = page.locator('[data-testid="chat-sidebar"]');

    const editorBox = await editor.boundingBox();
    const boardBox = await board.boundingBox();
    const sidebarBox = await sidebar.boundingBox();

    // Editor right edge should be <= board left edge
    const editorRightEdge = editorBox!.x + editorBox!.width;
    expect(editorRightEdge, "Editor overlaps with evidence board").toBeLessThanOrEqual(
      boardBox!.x + 5
    ); // 5px tolerance for borders

    // Board right edge should be <= sidebar left edge
    const boardRightEdge = boardBox!.x + boardBox!.width;
    expect(boardRightEdge, "Evidence board overlaps with sidebar").toBeLessThanOrEqual(
      sidebarBox!.x + 5
    );
  });

  test("editor pane has flex column layout", async ({ page }) => {
    const editor = page.locator('[data-testid="editor-pane"]');
    await expect(editor).toHaveCSS("display", "flex");
    await expect(editor).toHaveCSS("flex-direction", "column");
  });

  test("evidence board has flex column layout", async ({ page }) => {
    const board = page.locator('[data-testid="evidence-board"]');
    await expect(board).toHaveCSS("display", "flex");
    await expect(board).toHaveCSS("flex-direction", "column");
  });

  test("chat sidebar fills height", async ({ page }) => {
    const sidebar = page.locator('[data-testid="chat-sidebar"]');
    const sidebarBox = await sidebar.boundingBox();

    // Viewport height check
    const viewportSize = page.viewportSize();
    expect(sidebarBox!.height).toBeGreaterThanOrEqual(viewportSize!.height * 0.9);
  });
});

test.describe("Layout Responsive Behavior", () => {
  test("layout adapts to viewport width", async ({ page }) => {
    // Test at different viewport widths
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    const wideBoard = await page.locator('[data-testid="evidence-board"]').boundingBox();

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300); // Wait for resize

    const narrowBoard = await page.locator('[data-testid="evidence-board"]').boundingBox();

    // Board should be narrower on smaller viewport
    expect(narrowBoard!.width).toBeLessThan(wideBoard!.width);
  });
});

test.describe("Layout with Hidden Panels", () => {
  test("layout works with editor hidden", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Click hide editor button
    const hideButton = page.getByRole("button", { name: /hide editor/i });
    if (await hideButton.isVisible()) {
      await hideButton.click();
      await page.waitForTimeout(300);

      // Editor should be hidden
      const editor = page.locator('[data-testid="editor-pane"]');
      await expect(editor).not.toBeVisible();

      // Board should still be visible and have reasonable width
      const board = page.locator('[data-testid="evidence-board"]');
      await expect(board).toBeVisible();
      const boardBox = await board.boundingBox();
      expect(boardBox!.width).toBeGreaterThan(300);
    }
  });
});
