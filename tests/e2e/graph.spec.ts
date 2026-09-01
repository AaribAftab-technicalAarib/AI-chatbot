import { test, expect } from "@playwright/test";

test("home page loads and shows default graph", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /formula graph/i })).toBeVisible();
  await expect(page.getByLabel("Formula input")).toBeVisible();
  const svg = page.getByRole("img", { name: "Graph" });
  await expect(svg).toBeVisible();
  await expect(svg.locator("path")).toHaveCount(1);
});

test("typing a new formula updates the graph", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Formula input");
  await input.fill("y = x^2");
  await expect(page.getByLabel("Formula input")).toHaveValue("y = x^2");
  await expect(page.getByRole("img", { name: "Graph" }).locator("path")).toHaveCount(1);
});

test("invalid formula shows an error", async ({ page }) => {
  await page.goto("/");
  const input = page.getByLabel("Formula input");
  await input.fill("y = ((");
  await expect(page.getByText(/unmatched/i)).toBeVisible();
});

test("examples chip populates the input", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sine" }).click();
  await expect(page.getByLabel("Formula input")).toHaveValue("y = sin(x)");
});
