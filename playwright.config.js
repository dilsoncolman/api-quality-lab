import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 15_000,
  outputDir: "artifacts/test-results",
  reporter: [
    ["list"],
    ["json", { outputFile: "artifacts/test-results/playwright-report.json" }],
  ],
});
