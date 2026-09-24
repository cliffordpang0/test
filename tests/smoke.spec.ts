import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("empty and invalid snapshot states", async ({ page }) => {
  for (const state of ["empty", "invalid"]) {
    await page.route("**/src/data.ts", async (route) => {
      const response = await route.fetch();
      const original = await response.text();
      const mutation =
        state === "empty"
          ? "dataset.markets.length=0; dataset.observations.length=0;"
          : "dataset.observations.length=0;";
      await route.fulfill({ response, body: original + "\n" + mutation });
    });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name:
          state === "empty"
            ? "No markets available"
            : "Dataset could not be loaded",
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/${state}-state.png`,
      fullPage: true,
    });
    await page.unroute("**/src/data.ts");
  }
});
test("accessible views at desktop and tablet widths", async ({ page }) => {
  for (const width of [1440, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "overview",
      "compare",
      "scenario",
      "calculator",
      "methodology",
      "markets/ethiopia",
    ]) {
      await page.goto("/#" + route);
      await expect(page.locator("h1")).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      const audit = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(audit.violations).toEqual([]);
      if (width === 1440)
        await page.screenshot({
          path: `test-results/desktop-${route.replace("/", "-")}.png`,
          fullPage: true,
        });
    }
  }
});
test("complete desktop workflow and keyboard evidence", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Northern Norway ↗" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Northern Norway ↗" }).click();
  await expect(
    page.getByRole("heading", { name: "Northern Norway", exact: true }),
  ).toBeVisible();
  const summary = page.getByText("Evidence & source details").first();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("No source collected.", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Scenario lab", exact: true }).click();
  await page.getByRole("button", { name: /Cost-focused/ }).click();
  await expect(page.locator(".rank-name a").first()).toHaveText(
    "Itaipu-adjacent Paraguay",
  );
  await page.getByRole("checkbox").check();
  await page.getByRole("slider", { name: "Electricity cost weight" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByText("100.0%", { exact: true })).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "↓ Scored summary CSV" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toContain("demo-1.0-2026-09-24-scores.csv");
  expect(await file.failure()).toBeNull();
  await page
    .getByRole("link", { name: "Power-cost calculator", exact: true })
    .click();
  await expect(page.getByText("$2,038,890")).toHaveCount(2);
  await page.getByLabel("Expected uptime (%)").fill("101");
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByLabel("Expected uptime (%)").fill("0");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({ path: "test-results/desktop.png", fullPage: true });
});
test("mobile views have no page overflow, support deep links and missing states", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const route of [
    "overview",
    "compare",
    "scenario",
    "calculator",
    "methodology",
    "markets/ethiopia",
    "markets/missing",
  ]) {
    await page.goto("/#" + route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (route === "markets/ethiopia") {
      await expect(page.getByText("Review age", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Critical constraint", { exact: true }),
      ).toBeVisible();
    }
    await page.screenshot({
      path: `test-results/mobile-${route.replace("/", "-")}.png`,
      fullPage: true,
    });
  }
  await page.goto("/#overview");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: /Find the opportunity/ }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
