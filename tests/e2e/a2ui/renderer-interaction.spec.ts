import { test, expect } from "@playwright/test";

/**
 * A2UI v0.9 Renderer Interaction E2E (DOM-level)
 *
 * Drives the real SurfaceRenderer in a browser via the /a2ui-harness page,
 * exercising the full v0.9 feature set end-to-end: component rendering,
 * function-call + template-children bindings, two-way binding, field
 * validation, and the server-action HTTP round-trip.
 */

test.describe("A2UI v0.9 renderer interaction", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/a2ui-harness");
    await page.waitForSelector('[data-testid="a2ui-harness"]');
  });

  test("resolves a function-call (concat) binding in a heading", async ({ page }) => {
    // greeting = "Case for " + /name, where /name seeds to "Spade".
    await expect(page.getByRole("heading", { name: "Case for Spade" })).toBeVisible();
  });

  test("expands a template child list over the data-model array", async ({ page }) => {
    for (const name of ["Brigid", "Joel", "Wilmer"]) {
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }
  });

  test("two-way binds a text field back into the data model", async ({ page }) => {
    const field = page.getByLabel("Detective");
    await expect(field).toHaveValue("Spade");
    await field.fill("Archer");
    // The concat-bound heading recomputes from the same /name path.
    await expect(page.getByRole("heading", { name: "Case for Archer" })).toBeVisible();
  });

  test("shows a validation error for a bad email, then clears it", async ({ page }) => {
    // Scope to the harness region — Next.js renders its own role="alert"
    // route-announcer node at the document root.
    const harness = page.getByTestId("a2ui-harness");
    const email = page.getByLabel("Contact email");
    await email.fill("not-an-email");
    await email.blur();
    await expect(harness.getByRole("alert")).toContainText("bad email");

    await email.fill("sam@spade.io");
    await expect(harness.getByRole("alert")).toHaveCount(0);
  });

  test("round-trips a server action and applies the returned data model update", async ({
    page,
  }) => {
    // The "submit" action posts to /api/a2ui/action, which returns an
    // updateDataModel setting /status to "Submitted: submit".
    await page.getByRole("button", { name: "File the case" }).click();
    await expect(page.getByText("Submitted: submit")).toBeVisible();
  });
});
