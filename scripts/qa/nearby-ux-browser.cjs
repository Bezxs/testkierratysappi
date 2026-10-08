const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const playwrightModule = process.env.PLAYWRIGHT_MODULE_PATH;
const browserExecutable = process.env.BROWSER_EXECUTABLE_PATH;
if (!playwrightModule || !browserExecutable) {
  throw new Error(
    "Set PLAYWRIGHT_MODULE_PATH and BROWSER_EXECUTABLE_PATH to installed local QA tools.",
  );
}
const { chromium } = require(playwrightModule);
const baseUrl = process.env.NEARBY_QA_URL ?? "http://127.0.0.1:8093";
const evidenceDir = path.resolve("work/nearby-ux-qa");
fs.mkdirSync(evidenceDir, { recursive: true });
const directory = JSON.parse(
  fs.readFileSync("apps/mobile/assets/data/finland-recycling.json", "utf8"),
);
const sample = directory.points.find(
  (p) => p.name === null && p.address === null && p.kind === "container",
);
assert.ok(sample);

(async () => {
  const browser = await chromium.launch({
    executablePath: browserExecutable,
    headless: true,
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["geolocation"],
      geolocation: { ...sample.coordinates, accuracy: 10 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`${baseUrl}/nearby`);
    await page.getByTestId("nearby-find").click();
    await page.getByTestId("nearby-result").waitFor();
    const map = page.getByTestId("nearby-map");
    assert.ok(await map.isVisible());
    assert.ok(
      (await map.boundingBox()).y + (await map.boundingBox()).height <= 844,
      "Primary map action should fit initial phone viewport",
    );
    await page.getByText("Yhteisötieto · ei paikan päällä varmennettu", { exact: true }).waitFor();
    assert.equal(await page.getByTestId("nearby-details").count(), 0);
    assert.equal(
      await page.getByTestId("nearby-details-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await page.screenshot({ path: path.join(evidenceDir, "fi-light.png"), fullPage: true });
    await page.getByTestId("nearby-details-toggle").focus();
    await page.getByTestId("nearby-details-toggle").press("Enter");
    await page.getByTestId("nearby-details").waitFor();
    assert.equal(
      await page.getByTestId("nearby-details-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await page.getByText("Pisteen nimeä ei ole aineistossa", { exact: true }).waitFor();
    await page.getByTestId("nearby-details-toggle").click();
    await context.setOffline(true);
    await page.getByTestId("nearby-find").click();
    await page.getByTestId("nearby-result").waitFor();
    assert.ok(await map.isVisible(), "Local point search must survive offline transport");
    await context.setOffline(false);
    await page.emulateMedia({ colorScheme: "dark" });
    await page.waitForFunction(
      () =>
        getComputedStyle(document.querySelector('[data-testid="nearby-screen"]'))
          .backgroundColor === "rgb(20, 34, 27)",
      null,
      { timeout: 5000 },
    );
    await page.screenshot({ path: path.join(evidenceDir, "fi-dark.png"), fullPage: true });
    // Synthetic text-size QA, not iOS Dynamic Type.
    await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.querySelector('[data-testid="nearby-screen"]'),
        NodeFilter.SHOW_TEXT,
      );
      const elements = new Set();
      while (walker.nextNode())
        if (walker.currentNode.textContent.trim()) elements.add(walker.currentNode.parentElement);
      const sizes = [...elements].map((el) => {
        const style = getComputedStyle(el);
        return [el, parseFloat(style.fontSize), parseFloat(style.lineHeight)];
      });
      for (const [el, size, line] of sizes) {
        el.style.fontSize = `${size * 1.3}px`;
        el.style.lineHeight = `${(Number.isFinite(line) ? line : size * 1.4) * 1.3}px`;
      }
    });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: path.join(evidenceDir, "fi-large.png"), fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
    const english = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ["geolocation"],
      geolocation: { ...sample.coordinates, accuracy: 150 },
    });
    const en = await english.newPage();
    await en.goto(`${baseUrl}/`);
    await en.getByRole("radio", { name: "English", exact: true }).click();
    await en.getByTestId("home-nearby-action").click();
    await en.getByTestId("nearby-find").click();
    await en.getByTestId("nearby-result").waitFor();
    await en
      .getByText("Your location is approximate. The order of nearby points may vary.", {
        exact: true,
      })
      .waitFor();
    assert.ok(await en.getByRole("button", { name: "Show point on map", exact: true }).isVisible());
    await en.screenshot({ path: path.join(evidenceDir, "en.png"), fullPage: true });
    await english.close();
    console.log(
      "PASS: FI/EN, primary action visibility, expanded semantics, unknown fallback, offline local result, dark mode, synthetic large text, reduced-motion preference; no user GPS used.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
