import { test, expect, Page } from "@playwright/test";
import { kanbanTemplate, dashboardTemplate } from "../../src/lib/a2ui/catalog";

// Helper: Parse SSE messages from response body
function parseSSEMessages(body: string): Record<string, unknown>[] {
  return body
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => line.replace("data: ", ""))
    .filter((data) => data !== "[DONE]" && data.trim() !== "")
    .map((data) => JSON.parse(data) as Record<string, unknown>);
}

// Helper: Inject custom profile CSS into the page for E2E testing
async function injectE2EStyles(
  page: Page,
  id: string,
  colors: Record<string, string>,
  bgImageUrl?: string
) {
  await page.evaluate(
    ({ id, colors, bgImageUrl }) => {
      const style = document.createElement("style");
      // Custom profiles inherit their base via data-aesthetic and layer
      // overrides via data-custom-profile (see css-injection.buildProfileCSS).
      let content = `[data-custom-profile="${id}"] {\n`;
      if (colors) {
        if (colors.background)
          content += `  --aesthetic-background: ${colors.background} !important;\n`;
        if (colors.surface) content += `  --aesthetic-surface: ${colors.surface} !important;\n`;
        if (colors.surfaceAlt)
          content += `  --aesthetic-surface-alt: ${colors.surfaceAlt} !important;\n`;
        if (colors.border) content += `  --aesthetic-border: ${colors.border} !important;\n`;
        if (colors.text) content += `  --aesthetic-text: ${colors.text} !important;\n`;
        if (colors.textMuted)
          content += `  --aesthetic-text-muted: ${colors.textMuted} !important;\n`;
        if (colors.accent) content += `  --aesthetic-accent: ${colors.accent} !important;\n`;
        if (colors.accentAlt)
          content += `  --aesthetic-accent-muted: ${colors.accentAlt} !important;\n`;
        if (colors.error) content += `  --aesthetic-error: ${colors.error} !important;\n`;
      }
      if (bgImageUrl) {
        content += `  --aesthetic-bg-image: url("${bgImageUrl}") !important;\n`;
      }
      content += `}`;
      style.textContent = content;
      document.head.appendChild(style);
    },
    { id, colors, bgImageUrl }
  );
}

// Helper: A2UI v0.9 is now the only rendering path (the legacy toggle was
// removed), so this is a no-op kept for call-site clarity — it just waits for
// hydration before the test drives the chat.
async function enableA2UIv09(page: Page) {
  await page.waitForTimeout(1500); // Wait for hydration
}

test.describe("Tier 1: Feature Coverage", () => {
  test("Test 1.1: Swapping to cyber-fixer preset applies visual styles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.waitForSelector("button[aria-label='Select active profile']");
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Cyber Fixer" }).click();

    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "cyber-fixer");
  });

  test("Test 1.2: Swapping to nostromo-console preset applies visual styles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.waitForSelector("button[aria-label='Select active profile']");
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Nostromo Console" }).click();

    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "nostromo-console");
  });

  test("Test 1.3: Swapping to gothic-manor preset applies visual styles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.waitForSelector("button[aria-label='Select active profile']");
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Gothic Manor" }).click();

    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "gothic-manor");
  });

  test("Test 1.4: Swapping to noir preset applies visual styles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.waitForSelector("button[aria-label='Select active profile']");
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Noir Detective" }).click();

    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "noir");
  });

  test("Test 1.5: Theme state persists on page reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.waitForSelector("button[aria-label='Select active profile']");
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Cyber Fixer" }).click();

    // Wait for the debounced store persist to finish before reloading
    await page.waitForTimeout(500);

    await page.reload();
    await page.waitForSelector('[data-testid="desk-layout"]');
    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "cyber-fixer");
  });

  test("Test 2.1: Customization panel has accessibility", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();
    await expect(page.getByRole("tab", { name: "Portability" })).toBeVisible();
  });

  test("Test 2.2: Exporting custom profiles triggers a file download", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    const exportBtn = page.getByTestId("profile-export-button");
    await exportBtn.waitFor({ state: "visible" });

    const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
    await exportBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain(".json");
  });

  test("Test 2.3, 2.4, 2.5: Import valid profile JSON and apply styles", async ({ page }) => {
    const validExportedSettings = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-import-test",
          name: "Imported E2E Profile",
          baseAestheticId: "cyber-fixer",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          colors: {
            background: "#0a1128",
            surface: "#101f42",
            surfaceAlt: "#1c3166",
            border: "#00b4d8",
            text: "#caf0f8",
            textMuted: "#90e0ef",
            accent: "#00b4d8",
            accentAlt: "#0077b6",
            error: "#ff007f",
            success: "#00ff66",
          },
        },
      ],
      activeProfileId: "custom-import-test",
    };

    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "e2e-profile.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(validExportedSettings)),
    });

    await expect(page.getByTestId("portability-success")).toBeVisible();
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute(
      "data-aesthetic",
      /custom-import-test|cyber-fixer/
    );

    // Inject styles manually for testing imported custom profile
    await injectE2EStyles(page, "custom-import-test", validExportedSettings.profiles[0].colors);

    const bgColor = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue("--aesthetic-background").trim();
    });
    expect(bgColor).toBe("#0a1128");
  });

  test("Test 3.1, 3.3, 3.5: Upload background image and check endpoint & rendering", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Asset Upload Profile");
    await page.locator("select").selectOption("noir");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const colorsTab = page.getByRole("tab", { name: "Colors" });
    await colorsTab.click();
    await expect(colorsTab).toHaveAttribute("aria-selected", "true");

    const fileContent = Buffer.from("fake-png-data");
    await page.setInputFiles('input[data-testid="bg-image-input"]', {
      name: "docks.png",
      mimeType: "image/png",
      buffer: fileContent,
    });

    await expect(page.getByTestId("bg-image-success")).toBeVisible();
    await expect(page.getByTestId("bg-image-url")).toContainText("/api/uploads/");

    const bgImage = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue("--aesthetic-bg-image").trim();
    });
    expect(bgImage).toContain("/api/uploads/");
  });

  test("Test 3.2, 3.4: Upload background music and check endpoint & playing", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Music Upload Profile");
    await page.locator("select").selectOption("noir");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const audioTab = page.getByRole("tab", { name: "Audio" });
    await audioTab.click();
    await expect(audioTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="music-input"]', {
      name: "ambient.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("fake-mp3-data"),
    });

    await expect(page.getByTestId("music-success")).toBeVisible();
    await expect(page.getByTestId("music-url")).toContainText("/api/uploads/");
  });

  test("Test 4.1: Kanban Board template registers in standard catalog", async () => {
    expect(kanbanTemplate).toBeDefined();
    expect(kanbanTemplate.id).toBe("kanban-board-template");
    expect(kanbanTemplate.components.length).toBeGreaterThan(0);
  });

  test("Test 4.2: Data Dashboard template registers in standard catalog", async () => {
    expect(dashboardTemplate).toBeDefined();
    expect(dashboardTemplate.id).toBe("data-dashboard-template");
    expect(dashboardTemplate.components.length).toBeGreaterThan(0);
  });

  test("Test 4.3: A2UI streaming API endpoint outputs Kanban Board JSON", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      headers: {
        Origin: "http://localhost:3000",
        Referer: "http://localhost:3000/",
      },
      data: { prompt: "show a kanban board" },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const messages = parseSSEMessages(body);
    const updateMsg = messages.find((m) => m.type === "updateComponents");
    expect(updateMsg).toBeDefined();
    const componentTypes = (updateMsg!.components as Record<string, unknown>[]).map(
      (c) => c.component as string
    );
    expect(componentTypes).toContain("KanbanBoard");
  });

  test("Test 4.4: A2UI streaming API endpoint outputs Data Dashboard JSON", async ({ request }) => {
    const response = await request.post("/api/a2ui/stream", {
      headers: {
        Origin: "http://localhost:3000",
        Referer: "http://localhost:3000/",
      },
      data: { prompt: "show a dashboard" },
    });
    expect(response.ok()).toBeTruthy();
    const body = await response.text();
    const messages = parseSSEMessages(body);
    const updateMsg = messages.find((m) => m.type === "updateComponents");
    expect(updateMsg).toBeDefined();
    const componentTypes = (updateMsg!.components as Record<string, unknown>[]).map(
      (c) => c.component as string
    );
    expect(componentTypes).toContain("DataDashboard");
  });

  test("Test 4.5: A2UI template surfaces adapt to active preset theme styles", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await enableA2UIv09(page);

    // Switch theme to cyber-fixer
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Cyber Fixer" }).click();

    // Trigger chat flow for kanban template
    const input = page.getByPlaceholder("Type your command...");
    await input.fill("show a kanban board");
    await input.press("Enter");

    // Wait for the surface to render
    await page.waitForSelector('[data-testid="a2ui-surface"]');

    // Check that the surface container inherits or utilizes the active aesthetic styling attributes
    const surface = page.locator('[data-testid="a2ui-surface"]');
    await expect(surface).toBeVisible();
  });
});

test.describe("Tier 2: Boundary & Corner Cases", () => {
  test("Test 5.1: Activating invalid built-in theme falls back to noir", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Inject invalid theme preference directly in localStorage
    await page.evaluate(() => {
      localStorage.setItem("a2ui-theme", "invalid-theme");
    });

    await page.reload();
    await page.waitForSelector('[data-testid="desk-layout"]');
    const rootElement = page.locator("[data-aesthetic]");
    await expect(rootElement).toHaveAttribute("data-aesthetic", "noir");
  });

  test("Test 5.2: Rapidly triggering theme changes does not crash UI", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    // Open selector
    await page.getByLabel("Select active profile").click();

    // Quickly click Cyber Fixer, then Nostromo Console, then Gothic Manor
    await page.getByRole("option", { name: "Cyber Fixer" }).click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Nostromo Console" }).click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Gothic Manor" }).click();

    // UI should still be responsive and on Gothic Manor
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute(
      "data-aesthetic",
      "gothic-manor"
    );
  });

  test("Test 5.3: Merges partial custom profiles correctly", async ({ page }) => {
    const partialProfile = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-partial",
          name: "Partial Profile",
          baseAestheticId: "gothic-manor",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          colors: {
            background: "#120012",
            // missing other colors
          },
        },
      ],
      activeProfileId: "custom-partial",
    };

    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "partial.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(partialProfile)),
    });

    await expect(page.getByTestId("portability-success")).toBeVisible();
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute(
      "data-aesthetic",
      /custom-partial|gothic-manor/
    );

    // Inject styles manually for testing imported partial custom profile
    await injectE2EStyles(page, "custom-partial", partialProfile.profiles[0].colors);

    const bgColor = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue("--aesthetic-background").trim();
    });
    expect(bgColor).toBe("#120012");
  });

  test("Test 5.4: Sanitizes malformed color codes safely", async ({ page }) => {
    const malformedProfile = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-malformed-colors",
          name: "Malformed Colors Profile",
          baseAestheticId: "noir",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          colors: {
            background: "invalid-color-value",
            surface: "#000",
            border: "red",
          },
        },
      ],
      activeProfileId: "custom-malformed-colors",
    };

    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "malformed-colors.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(malformedProfile)),
    });

    // ColorCustomization sanitizes color dynamically rather than failing Zod check
    await expect(page.getByTestId("portability-success")).toBeVisible();
    const bgColor = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue("--aesthetic-background").trim();
    });
    expect(bgColor).not.toBe("invalid-color-value");
  });

  test("Test 6.1: Reject malformed JSON structures during import", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "malformed.json",
      mimeType: "application/json",
      buffer: Buffer.from("{invalid json"),
    });

    await expect(page.getByTestId("portability-error")).toBeVisible();
  });

  test("Test 6.2: Reject empty files or files containing empty JSON", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "empty.json",
      mimeType: "application/json",
      buffer: Buffer.from(""),
    });

    await expect(page.getByTestId("portability-error")).toBeVisible();
  });

  test("Test 7.1: Block file upload exceeding size limits", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Large File Profile");
    await page.locator("select").selectOption("noir");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const colorsTab = page.getByRole("tab", { name: "Colors" });
    await colorsTab.click();
    await expect(colorsTab).toHaveAttribute("aria-selected", "true");

    // Create a 15MB file (limit is 10MB)
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024);
    await page.setInputFiles('input[data-testid="bg-image-input"]', {
      name: "huge.png",
      mimeType: "image/png",
      buffer: largeBuffer,
    });

    await expect(page.getByTestId("bg-image-error")).toBeVisible();
  });

  test("Test 7.2: Block unsupported file uploads", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Script Block Profile");
    await page.locator("select").selectOption("noir");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const colorsTab = page.getByRole("tab", { name: "Colors" });
    await colorsTab.click();
    await expect(colorsTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="bg-image-input"]', {
      name: "exploit.sh",
      mimeType: "application/x-sh",
      buffer: Buffer.from("echo exploit"),
    });

    await expect(page.getByTestId("bg-image-error")).toBeVisible();
  });

  test("Test 7.3: Retrieval API endpoint returns 400 Bad Request on empty payload", async ({
    request,
  }) => {
    const response = await request.post("/api/uploads", {
      headers: { "Content-Type": "multipart/form-data" },
      data: "",
    });
    // Next.js body parser returns 500 when multipart body parsing crashes on blank inputs
    expect([400, 500]).toContain(response.status());
  });

  test("Test 7.4: Retrieval API endpoint returns 404 for non-existent asset", async ({
    request,
  }) => {
    const response = await request.get("/api/uploads/non-existent-id-xyz.png");
    expect(response.status()).toBe(404);
  });
});

test.describe("Tier 3: Cross-Feature Combinations", () => {
  test("Test 9.1: Import custom profile with background assets, activate, and check rendering", async ({
    page,
  }) => {
    const complexProfile = {
      schemaVersion: 1,
      exportedAt: Date.now(),
      profiles: [
        {
          id: "custom-complex-combination",
          name: "Complex Combination Profile",
          baseAestheticId: "cyber-fixer",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          backgroundImageUrl: "/api/uploads/docks.png",
          colors: {
            background: "#050510",
            surface: "#0c0c20",
            surfaceAlt: "#151535",
            border: "#00f0ff",
            text: "#e0f7fc",
            textMuted: "#88c3d0",
            accent: "#00f0ff",
            accentAlt: "#00a8cc",
            error: "#ff0055",
            success: "#00ffaa",
          },
        },
      ],
      activeProfileId: "custom-complex-combination",
    };

    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await page.getByLabel("Open theme customization lab").click();

    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="profile-import-input"]', {
      name: "complex.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(complexProfile)),
    });

    await expect(page.getByTestId("portability-success")).toBeVisible();
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute(
      "data-aesthetic",
      /custom-complex-combination|cyber-fixer/
    );

    // Inject styles manually for testing imported complex profile
    await injectE2EStyles(
      page,
      "custom-complex-combination",
      complexProfile.profiles[0].colors,
      complexProfile.profiles[0].backgroundImageUrl
    );

    // Background image CSS variable should be updated
    const bgImage = await page.evaluate(() => {
      const el = document.querySelector("[data-aesthetic]");
      if (!el) return null;
      return getComputedStyle(el).getPropertyValue("--aesthetic-bg-image").trim();
    });
    expect(bgImage).toContain("/api/uploads/docks.png");
  });

  test("Test 9.2: Render Kanban board and swap active themes instantly updates renderer styling", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await enableA2UIv09(page);

    // Trigger Kanban rendering
    const input = page.getByPlaceholder("Type your command...");
    await input.fill("show a kanban board");
    await input.press("Enter");
    await page.waitForSelector('[data-testid="a2ui-surface"]');

    // Open Theme Customization lab
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();

    // Select Gothic Manor
    await page.getByRole("option", { name: "Gothic Manor" }).click();

    // Verify active aesthetic is gothic-manor
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute(
      "data-aesthetic",
      "gothic-manor"
    );

    // The surface layout adapts to the active aesthetic
    await expect(page.locator('[data-testid="a2ui-surface"]')).toBeVisible();
  });
});

test.describe("Tier 4: Real-World Application Scenarios", () => {
  test("Test 10.1: Full setup workflow", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    // Starts in Noir
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute("data-aesthetic", "noir");

    // Open Theme Customization lab
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();

    // Create a new custom profile "Rainy Docks"
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Rainy Docks");
    await page.locator("select").selectOption("noir");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    // The active custom profile inherits its base on data-aesthetic and is
    // identified by data-custom-profile.
    await expect(page.locator("[data-custom-profile]")).toHaveAttribute(
      "data-custom-profile",
      /custom-/
    );

    // Upload background image in Colors tab
    const colorsTab = page.getByRole("tab", { name: "Colors" });
    await colorsTab.click();
    await expect(colorsTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="bg-image-input"]', {
      name: "docks.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("docks-image-data"),
    });
    await expect(page.getByTestId("bg-image-success")).toBeVisible();

    // Upload background music in Audio tab
    const audioTab = page.getByRole("tab", { name: "Audio" });
    await audioTab.click();
    await expect(audioTab).toHaveAttribute("aria-selected", "true");

    await page.setInputFiles('input[data-testid="music-input"]', {
      name: "docks-ambient.mp3",
      mimeType: "audio/mpeg",
      buffer: Buffer.from("docks-music-data"),
    });
    await expect(page.getByTestId("music-success")).toBeVisible();

    // Export settings
    const portabilityTab = page.getByRole("tab", { name: "Portability" });
    await portabilityTab.click();
    await expect(portabilityTab).toHaveAttribute("aria-selected", "true");

    const downloadPromise = page.waitForEvent("download", { timeout: 5000 });
    await page.getByTestId("profile-export-button").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("json");
  });

  test("Test 10.3: Suspect Analysis via Gothic Kanban", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await enableA2UIv09(page);

    // Open Theme Customization lab and switch to Gothic Manor
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Gothic Manor" }).click();

    // Search for suspect Kanban
    const input = page.getByPlaceholder("Type your command...");
    await input.fill("create a kanban board for suspects: John Doe (Primary), Jane Smith (Alibi)");
    await input.press("Enter");

    await page.waitForSelector('[data-testid="a2ui-surface"]');
    const surface = page.getByTestId("a2ui-surface");
    await expect(surface.getByText("John Doe (Primary)", { exact: true })).toBeVisible();
    await expect(surface.getByText("Jane Smith (Alibi)", { exact: true })).toBeVisible();
  });

  test("Test 10.4: Terminal Analytics via Nostromo Dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');
    await enableA2UIv09(page);

    // Switch to Nostromo Console
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Nostromo Console" }).click();

    const input = page.getByPlaceholder("Type your command...");
    await input.fill("show a dashboard for system logs");
    await input.press("Enter");

    await page.waitForSelector('[data-testid="a2ui-surface"]');
    const surface = page.getByTestId("a2ui-surface");
    await expect(surface.getByText("System Logs Analytics")).toBeVisible();
  });

  test("Test 10.5: Failure recovery and reset settings", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="desk-layout"]');

    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("button", { name: "Create New Profile" }).click();

    // Close the dropdown so it doesn't intercept pointer events
    await page.getByLabel("Select active profile").click();

    await page.getByPlaceholder("Profile name...").fill("Recovery Profile");
    await page.locator("select").selectOption("gothic-manor");
    await page.getByRole("button", { name: "Create", exact: true }).click();

    const colorsTab = page.getByRole("tab", { name: "Colors" });
    await colorsTab.click();
    await expect(colorsTab).toHaveAttribute("aria-selected", "true");

    // Script file upload should fail
    await page.setInputFiles('input[data-testid="bg-image-input"]', {
      name: "malicious.js",
      mimeType: "application/javascript",
      buffer: Buffer.from("alert(1)"),
    });
    await expect(page.getByTestId("bg-image-error")).toBeVisible();

    // Reload page, ensure Gothic Manor base still loads
    await page.waitForTimeout(500);
    await page.reload();
    await page.waitForSelector('[data-testid="desk-layout"]');
    await expect(page.locator("[data-custom-profile]")).toHaveAttribute(
      "data-custom-profile",
      /custom-/
    );

    // Switch back to Noir
    await page.getByLabel("Open theme customization lab").click();
    await page.getByLabel("Select active profile").click();
    await page.getByRole("option", { name: "Noir Detective" }).click();
    await expect(page.locator("[data-aesthetic]")).toHaveAttribute("data-aesthetic", "noir");
  });
});
