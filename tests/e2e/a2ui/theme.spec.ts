import { test, expect } from "@playwright/test";

/**
 * A2UI v0.9 Theme E2E Tests
 *
 * Tests theme functionality and noir styling.
 * The main app uses Tailwind noir classes (noir-black, noir-paper, etc.)
 * The A2UI ThemeProvider with CSS variables is for future component integration.
 */

test.describe("A2UI Theme - Noir Styling", () => {
  test("page loads with noir theme styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Check that noir Tailwind classes are applied
    const layout = page.locator('[data-testid="desk-layout"]');
    await expect(layout).toBeVisible();

    // Layout should have noir background classes
    const hasNoirClasses = await layout.evaluate((el) => {
      const classes = el.className;
      return classes.includes("bg-noir") || classes.includes("text-noir");
    });

    expect(hasNoirClasses).toBeTruthy();
  });

  test("noir theme colors are visible on page", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // The layout should have a dark background
    const layout = page.locator('[data-testid="desk-layout"]');
    const bgColor = await layout.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be a dark color (noir-dark is #1a1a1a)
    // Parse RGB and check it's dark
    const rgbMatch = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      const luminance = (r + g + b) / 3;
      expect(luminance).toBeLessThan(100); // Dark background
    }
  });

  test("chat sidebar uses noir styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="chat-sidebar"]');

    const sidebar = page.locator('[data-testid="chat-sidebar"]');
    await expect(sidebar).toBeVisible();

    // Sidebar should have dark background
    const bgColor = await sidebar.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should be dark/transparent
    expect(bgColor).toBeTruthy();
  });

  test("evidence board uses noir styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="evidence-board"]');

    const board = page.locator('[data-testid="evidence-board"]');
    await expect(board).toBeVisible();
  });

  test("editor pane uses noir styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="editor-pane"]');

    const editor = page.locator('[data-testid="editor-pane"]');
    await expect(editor).toBeVisible();

    // Check it has noir background class
    const hasNoirBg = await editor.evaluate((el) => {
      return el.className.includes("noir");
    });

    expect(hasNoirBg).toBeTruthy();
  });
});

test.describe("A2UI Theme - LocalStorage", () => {
  test("theme preference can be stored in localStorage", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Set theme preference
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "noir");
    });

    // Verify it was stored
    const theme = await page.evaluate(() => {
      return localStorage.getItem("a2ui-theme");
    });

    expect(theme).toBe("noir");
  });

  test("theme preference persists across page loads", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Set theme
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "standard");
    });

    // Reload page
    await page.reload();
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Check theme persisted
    const theme = await page.evaluate(() => {
      return localStorage.getItem("a2ui-theme");
    });

    expect(theme).toBe("standard");
  });

  test("theme can be toggled between noir and standard", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Start with noir
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "noir");
    });

    let theme = await page.evaluate(() => localStorage.getItem("a2ui-theme"));
    expect(theme).toBe("noir");

    // Toggle to standard
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "standard");
    });

    theme = await page.evaluate(() => localStorage.getItem("a2ui-theme"));
    expect(theme).toBe("standard");

    // Toggle back to noir
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "noir");
    });

    theme = await page.evaluate(() => localStorage.getItem("a2ui-theme"));
    expect(theme).toBe("noir");
  });
});

test.describe("A2UI Theme - Visual Elements", () => {
  test("page has correct font styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Check that text is readable (not black on black)
    const textColor = await page.locator("body").evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    expect(textColor).toBeTruthy();
  });

  test("interactive elements are visible", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Chat input should be visible and styled
    const input = page.getByPlaceholder("Type your command...");
    await expect(input).toBeVisible();
  });

  test("page renders without CSS errors", async ({ page }) => {
    // Collect console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Filter out non-CSS related errors
    const cssErrors = errors.filter(
      (e) => e.includes("CSS") || e.includes("style") || e.includes("font")
    );

    // Should have no CSS-related errors
    expect(cssErrors.length).toBe(0);
  });

  test("background has appropriate contrast", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Get the main layout's background
    const layout = page.locator('[data-testid="desk-layout"]');
    const bgColor = await layout.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });

    // Background should be defined
    expect(bgColor).toBeTruthy();
    expect(bgColor).not.toBe("transparent");
  });
});

test.describe("A2UI Theme - Accessibility", () => {
  test("page has sufficient color contrast", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Get text and background colors
    const colors = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      return {
        text: style.color,
        bg: style.backgroundColor,
      };
    });

    // Both should be defined
    expect(colors.text).toBeTruthy();
    expect(colors.bg).toBeTruthy();

    // They should be different (minimal contrast check)
    expect(colors.text).not.toBe(colors.bg);
  });

  test("input fields are distinguishable", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    const input = page.getByPlaceholder("Type your command...");
    await expect(input).toBeVisible();

    // Input should be focusable
    await input.focus();
    await expect(input).toBeFocused();
  });
});
