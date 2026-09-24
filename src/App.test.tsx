import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { dataset } from "./data";
beforeEach(() => {
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  window.location.hash = "";
});
it("applies presets, custom weights, confidence and reset", async () => {
  window.location.hash = "scenario";
  render(<App />);
  const user = userEvent.setup();
  expect(screen.getByText("78.7")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /Cost-focused/ }));
  expect(screen.queryByText("78.7")).toBeNull();
  await user.click(screen.getByRole("checkbox"));
  expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
  fireEvent.change(
    screen.getByRole("slider", { name: "Electricity cost weight" }),
    { target: { value: 100 } },
  );
  expect(screen.getAllByText("100.0%").length).toBeGreaterThan(0);
  await user.click(screen.getByRole("button", { name: "Reset to default" }));
  expect(
    screen
      .getByRole("button", { name: /Base case/ })
      .getAttribute("aria-pressed"),
  ).toBe("true");
});
it("reports invalid calculator input and keeps zero valid", async () => {
  window.location.hash = "calculator";
  render(<App />);
  const input = screen.getByLabelText("Expected uptime (%)");
  fireEvent.change(input, { target: { value: 101 } });
  expect(screen.getByRole("alert").textContent).toContain("uptime 0–100%");
  fireEvent.change(input, { target: { value: 0 } });
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
});
it("provides keyboard focus for evidence disclosure", async () => {
  window.location.hash = "markets/norway";
  render(<App />);
  const summary = screen.getAllByText("Evidence & source details")[0];
  summary.focus();
  expect(document.activeElement).toBe(summary);
  expect(summary.tagName).toBe("SUMMARY");
});
it("renders useful empty and invalid data states", () => {
  const empty = { ...dataset, markets: [], observations: [] };
  const view = render(<App data={empty} />);
  expect(screen.getByText("No markets available")).toBeTruthy();
  view.rerender(<App data={{ ...dataset, observations: [] }} />);
  expect(screen.getByRole("alert").textContent).toContain(
    "Dataset could not be loaded",
  );
});
