// Isolated UI regression fixtures. Never application/provider seed data.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const modulePath = process.env.PLAYWRIGHT_MODULE_PATH;
const executablePath = process.env.BROWSER_EXECUTABLE_PATH;
if (!modulePath || !executablePath) throw new Error("Set installed Playwright and browser paths.");
const { chromium } = require(modulePath);
const baseUrl = process.env.APP_QA_URL ?? "http://127.0.0.1:8093";
const evidence = path.resolve("work/app-refinement-qa");
fs.mkdirSync(evidence, { recursive: true });
const gtin = "3017620422003"; // Public example, not a user's scan.
const provenance = {
  sourceId: "qa-only",
  sourceName: "QA fixture provider",
  sourceRecordId: gtin,
  sourceUrl: "https://example.test/qa",
  retrievedAt: "2026-10-08T12:00:00.000Z",
  confidence: 0.65,
  verificationStatus: "mock",
  license: {
    id: "qa-only",
    name: "QA-only fixture",
    url: "https://example.test/license",
    attributionText: "Not real product data",
    shareAlike: false,
  },
};
const observed = (value) => ({ value, provenance });
const part = {
  id: "qa-plastic",
  packagingStatus: observed("packaging"),
  materialFamily: observed("plastic"),
  shape: observed("other"),
  conditions: { hazardousResidue: "unknown", pressurized: "unknown", emptied: "unknown" },
};
const unknownPart = { ...part, id: "qa-unknown", materialFamily: observed("unknown") };
const confidence = { tier: "medium", score: 0.65, reasons: ["QA fixture"] };
const trace = { evaluatedBranches: ["qa"], decisiveFields: ["materialFamily"] };
const rule = {
  id: "qa-rule",
  version: "qa-only-v1",
  jurisdiction: "FI",
  sourceName: "QA rule fixture",
  sourceUrl: "https://example.test/rule",
  checkedAt: "2026-10-08",
  effectiveFrom: "2026-10-08",
  verificationStatus: "verified",
};
const product = {
  gtin,
  name: observed("QA fixture — two parts"),
  packagingCompleteness: observed("partial"),
  packagingComponents: [part, unknownPart],
};
const common = {
  gtin,
  product,
  provider: { id: "qa-only", name: "QA fixture provider" },
  cache: {
    hit: false,
    storedAt: "2026-10-08T12:00:00.000Z",
    expiresAt: "2026-10-08T18:00:00.000Z",
  },
};
const resolved = {
  ...common,
  status: "resolved",
  components: [
    {
      observation: part,
      sorting: {
        status: "resolved",
        componentId: part.id,
        confidence,
        trace,
        destination: {
          id: "plastic_packaging",
          label: { fi: "QA — muovinkeräys", en: "QA — plastic collection" },
        },
        preparation: { fi: "QA-valmistelu", en: "QA preparation" },
        explanation: { fi: "QA-selitys, ei oikea ohje", en: "QA explanation, not real guidance" },
        exceptions: [],
        rule,
      },
    },
    {
      observation: unknownPart,
      sorting: {
        status: "unknown",
        componentId: unknownPart.id,
        confidence: { tier: "unknown", score: 0, reasons: ["QA fixture"] },
        trace,
        reason: "material_missing",
        nextAction: { fi: "QA — tarkista osa", en: "QA — check the part" },
        sources: [],
      },
    },
  ],
};
const missing = {
  ...common,
  status: "packaging_missing",
  product: { ...product, packagingComponents: [], packagingCompleteness: observed("unknown") },
  missingFields: ["packagingComponents"],
};
const directory = JSON.parse(
  fs.readFileSync("mobile/app/assets/data/finland-recycling.json", "utf8"),
);
const nearbyPoint = directory.points.find((point) => point.name && point.address);
assert.ok(nearbyPoint);

async function layout(page) {
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    "Horizontal page overflow",
  );
  const overflow = await page.evaluate(() =>
    [...document.querySelectorAll("div, input, textarea")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return (
          box.width > 0 && box.height > 0 && (box.left < -1 || box.right > window.innerWidth + 1)
        );
      })
      .map((el) => ({
        text: el.textContent.slice(0, 80),
        role: el.getAttribute("role"),
        width: el.getBoundingClientRect().width,
      })),
  );
  assert.deepEqual(overflow, [], "Clipped/overflowing layout elements");
}
async function shot(page, name) {
  await page.evaluate(() => {
    for (const el of document.querySelectorAll("div"))
      if (el.scrollHeight > el.clientHeight) el.scrollTop = 0;
  });
  try {
    await layout(page);
  } catch (e) {
    await page.screenshot({ path: path.join(evidence, "failure-" + name + ".png") });
    throw new Error(name + ": " + e.message);
  }
  await page.screenshot({ path: path.join(evidence, name + ".png"), fullPage: true });
}
async function largeText(page) {
  // Synthetic web text scaling, not native Dynamic Type acceptance.
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const elements = new Set();
    while (walker.nextNode())
      if (walker.currentNode.textContent.trim()) elements.add(walker.currentNode.parentElement);
    for (const el of document.querySelectorAll("input, textarea")) elements.add(el);
    const sizes = [...elements].map((el) => {
      const s = getComputedStyle(el);
      return [el, parseFloat(s.fontSize), parseFloat(s.lineHeight)];
    });
    for (const [el, size, line] of sizes) {
      el.style.fontSize = size * 1.3 + "px";
      el.style.lineHeight = (Number.isFinite(line) ? line : size * 1.4) * 1.3 + "px";
    }
  });
}

async function darkMode(page) {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForFunction(
    () =>
      getComputedStyle(document.getElementById("app-screen-surface")).backgroundColor ===
      "rgb(20, 34, 27)",
  );
}

async function resultDetails(page, language, labels) {
  for (const value of [
    resolved.components[0].sorting.preparation[language],
    resolved.components[0].sorting.explanation[language],
    resolved.components[1].sorting.nextAction[language],
    "QA rule fixture",
    "QA-only fixture",
    "qa-only-v1",
    "2026-10-08",
    labels.noApplicableRuleSource,
    labels.ruleVerificationLabel,
    labels.ruleJurisdictionLabel,
    labels.checkedLabel,
    labels.ruleVersionLabel,
  ]) {
    assert.ok((await page.locator("body").innerText()).includes(value), value);
  }
  assert.equal(await page.getByTestId("sorting-result-resolved").count(), 1);
  assert.equal(await page.getByTestId("sorting-result-unknown").count(), 1);
  assert.ok(await page.getByText("1 / 2", { exact: true }).isVisible());
  assert.ok(await page.getByText("2 / 2", { exact: true }).isVisible());
  assert.ok(await page.getByText("65%", { exact: true }).isVisible());
  assert.ok(await page.getByText("0%", { exact: true }).isVisible());
}

async function nearbyChecks(page, context, language, labels) {
  let scenario = "resolved";
  let requests = 0;
  let release;
  let expectedQuery = "QA test address";
  const geocodingBody = [
    {
      lat: String(nearbyPoint.coordinates.latitude),
      lon: String(nearbyPoint.coordinates.longitude),
    },
  ];
  const routePattern = "https://nominatim.openstreetmap.org/search?*";
  const externalPattern = "https://www.openstreetmap.org/**";
  await context.route(externalPattern, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<title>External link QA</title>",
    }),
  );
  await context.route(routePattern, async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET",
          "access-control-allow-headers": "*",
        },
      });
    requests++;
    const query = new URL(route.request().url()).searchParams;
    assert.equal(query.get("format"), "json");
    assert.equal(query.get("limit"), "1");
    assert.equal(query.get(/^\d{5}$/.test(expectedQuery) ? "postalcode" : "q"), expectedQuery);
    const current = scenario;
    if (current === "loading") await new Promise((resolve) => (release = resolve));
    await route.fulfill({
      status: current === "unavailable" ? 503 : 200,
      contentType: "application/json",
      headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify(current === "not_found" ? [] : geocodingBody),
    });
  });
  try {
    await page.goto(baseUrl);
    await page.getByTestId("home-nearby-action").click();
    await page.getByTestId("nearby-screen").waitFor();
    assert.equal(await page.getByTestId("nearby-result").count(), 0);
    assert.equal(requests, 0, "Nearby navigation never submits an address");
    const input = page.getByTestId("nearby-location-input");
    const submit = page.getByTestId("nearby-location-submit");
    assert.equal(await input.getAttribute("aria-label"), labels.nearbyLocationLabel);
    assert.equal(await input.getAttribute("placeholder"), labels.nearbyLocationPlaceholder);
    assert.equal(await input.getAttribute("maxlength"), "160");
    assert.equal(await submit.getAttribute("aria-disabled"), "true");
    await input.focus();
    await page.waitForFunction(
      () =>
        document.activeElement ===
          document.querySelector('[data-testid="nearby-location-input"]') &&
        getComputedStyle(document.activeElement).borderTopColor === "rgb(36, 77, 60)",
    );
    await shot(page, language + "-nearby-focus");
    await input.fill("   ");
    await input.press("Enter");
    await page.getByTestId("nearby-location-error").waitFor();
    assert.equal(requests, 0, "Empty address validation never reaches Nominatim");
    assert.ok((await page.getByRole("alert").innerText()).includes(labels.nearbyLocationInvalid));
    await shot(page, language + "-nearby-invalid");
    await input.fill(expectedQuery);
    assert.equal(await page.getByTestId("nearby-location-error").count(), 0);
    for (const state of ["not_found", "unavailable"]) {
      scenario = state;
      await submit.click();
      const error =
        state === "not_found" ? labels.nearbyLocationNotFound : labels.nearbyLocationError;
      await page.getByRole("alert").filter({ hasText: error }).waitFor();
      assert.ok(await input.isVisible());
      assert.ok(await page.getByTestId("nearby-find").isVisible());
      await shot(page, language + "-nearby-" + state);
    }
    scenario = "loading";
    await submit.click();
    await page.getByText(labels.nearbyLoading, { exact: true }).waitFor();
    assert.equal(await submit.getAttribute("aria-disabled"), "true");
    await shot(page, language + "-nearby-loading");
    await page.getByRole("button", { name: labels.cancel, exact: true }).click();
    assert.equal(await page.getByText(labels.nearbyLoading, { exact: true }).count(), 0);
    const response = page.waitForResponse(routePattern);
    assert.equal(typeof release, "function");
    release();
    await (await response).finished();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    assert.equal(
      await page.getByTestId("nearby-result").count(),
      0,
      "Cancelled result stays cleared",
    );
    scenario = "resolved";
    expectedQuery = "00100";
    await input.fill(expectedQuery);
    await input.press("Enter");
    await page.getByTestId("nearby-result").waitFor();
    assert.ok(await page.getByText(nearbyPoint.name, { exact: true }).isVisible());
    assert.ok(await page.getByText(nearbyPoint.address, { exact: true }).isVisible());
    assert.ok(
      await page
        .getByText(language === "fi" ? "alle 50 m" : "under 50 m", { exact: true })
        .isVisible(),
    );
    assert.ok(await page.getByText(labels.nearbyUnverified, { exact: true }).isVisible());
    assert.ok(await page.getByText(labels.nearbyQuickCaution, { exact: true }).isVisible());
    assert.ok(await page.getByText(labels.nearbySource, { exact: true }).isVisible());
    for (const id of [
      "nearby-map",
      "nearby-find",
      "nearby-details-toggle",
      "nearby-privacy-toggle",
    ]) {
      const box = await page.getByTestId(id).boundingBox();
      assert.ok(box.width >= 44 && box.height >= 44, id + " touch target");
    }
    const mapPopup = context.waitForEvent("page");
    await page.getByTestId("nearby-map").click();
    const map = await mapPopup;
    await map.waitForURL("https://www.openstreetmap.org/**");
    const mapUrl = new URL(map.url());
    assert.equal(mapUrl.searchParams.get("mlat"), String(nearbyPoint.coordinates.latitude));
    assert.equal(mapUrl.searchParams.get("mlon"), String(nearbyPoint.coordinates.longitude));
    await map.close();
    await page.getByTestId("nearby-details-toggle").focus();
    await page.getByTestId("nearby-details-toggle").press("Enter");
    const details = page.getByTestId("nearby-details");
    await details.waitFor();
    assert.equal(
      await page.getByTestId("nearby-details-toggle").getAttribute("aria-expanded"),
      "true",
    );
    assert.ok((await details.innerText()).includes(nearbyPoint.id));
    assert.ok((await details.innerText()).includes(labels.nearbyCaution));
    const sourcePopup = context.waitForEvent("page");
    await page.getByRole("link", { name: labels.nearbyDetails, exact: true }).click();
    const source = await sourcePopup;
    await source.waitForURL("https://www.openstreetmap.org/" + nearbyPoint.id);
    await source.close();
    await page.getByTestId("nearby-privacy-toggle").click();
    assert.equal(
      await page.getByTestId("nearby-privacy-toggle").getAttribute("aria-expanded"),
      "true",
    );
    assert.ok((await page.locator("body").innerText()).includes(labels.nearbyPurpose));
    await shot(page, language + "-nearby-result-details");
    await darkMode(page);
    await shot(page, language + "-nearby-result-dark");
    await largeText(page);
    await page.setViewportSize({ width: 320, height: 740 });
    await shot(page, language + "-nearby-result-dark-large-320");
    await page.getByTestId("nearby-close-action").click();
    await page.getByTestId("home-screen").waitFor();
    await page.getByTestId("home-nearby-action").click();
    await page.getByTestId("nearby-location-input").waitFor();
    assert.equal(await page.getByTestId("nearby-result").count(), 0);
    await page.getByTestId("nearby-location-input").focus();
    await page.waitForFunction(
      () => getComputedStyle(document.activeElement).borderTopColor === "rgb(99, 209, 162)",
    );
    await largeText(page);
    await shot(page, language + "-nearby-form-dark-large-320");
    await page.emulateMedia({ colorScheme: "light" });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(requests, 4, "Only explicit address submissions perform geocoding");
    await page.goto(baseUrl);
    await page.getByTestId("home-screen").waitFor();
  } finally {
    release?.();
    await context.unroute(routePattern);
    await context.unroute(externalPattern);
  }
}

(async () => {
  const { messages } = await import("../../mobile/localization/dist/index.js");
  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    for (const language of ["fi", "en"]) {
      const labels = messages[language];
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let scenario = "not_found";
      let requests = 0;
      await context.route("**/v1/recycling/lookup", async (route) => {
        if (route.request().method() === "OPTIONS")
          return route.fulfill({
            status: 204,
            headers: {
              "access-control-allow-origin": "*",
              "access-control-allow-methods": "POST",
              "access-control-allow-headers": "content-type",
            },
          });
        requests++;
        assert.equal(route.request().postDataJSON().gtin, gtin);
        if (scenario === "offline") return route.abort("internetdisconnected");
        if (scenario === "not_found") await new Promise((resolve) => setTimeout(resolve, 600));
        const body =
          scenario === "resolved"
            ? resolved
            : scenario === "packaging_missing"
              ? missing
              : scenario === "not_found"
                ? { status: "not_found", gtin }
                : { status: "provider_unavailable", gtin, retryable: true };
        await route.fulfill({
          status: scenario === "not_found" ? 404 : scenario === "provider_unavailable" ? 503 : 200,
          contentType: "application/json",
          headers: { "access-control-allow-origin": "*" },
          body: JSON.stringify(body),
        });
      });
      await page.goto(baseUrl);
      await page.getByTestId("home-screen").waitFor();
      if (language === "en") await page.getByTestId("language-en").click();
      assert.ok(
        !(await page.locator("body").innerText()).includes(
          language === "fi" ? "Ei tiliä." : "No account.",
        ),
      );
      assert.ok(await page.getByTestId("home-legal-action").isVisible());
      assert.equal(await page.getByTestId("scan-package-mark").getAttribute("aria-hidden"), "true");
      for (const kind of ["manual", "nearby", "guide", "history"])
        assert.equal(
          await page.getByTestId("action-icon-" + kind).getAttribute("aria-hidden"),
          "true",
        );
      await page.getByTestId("home-nearby-action").waitFor({ state: "visible" });
      await page.getByTestId("home-guide-action").waitFor({ state: "visible" });
      await page.evaluate(() => document.fonts.ready);
      const nearbyTile = await page.getByTestId("home-nearby-action").boundingBox();
      const guideTile = await page.getByTestId("home-guide-action").boundingBox();
      assert.ok(Math.abs(nearbyTile.y - guideTile.y) < 1, "Phone navigation tiles share a row");
      await page.getByTestId("home-guide-action").focus();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('[data-testid="home-guide-action"]'))
            .borderTopColor === "rgb(36, 77, 60)",
      );
      await page.getByTestId("home-guide-action").press("Enter");
      await page
        .getByRole("heading", {
          name: language === "fi" ? "Lajitteluopas" : "Sorting guide",
          exact: true,
        })
        .waitFor();
      await page.goto(baseUrl);
      await page.getByTestId("home-screen").waitFor();
      await shot(page, language + "-home");
      for (const id of [
        "home-scan-action",
        "home-manual-action",
        "home-nearby-action",
        "home-guide-action",
        "home-history-action",
      ]) {
        const box = await page.getByTestId(id).boundingBox();
        assert.ok(box.height >= 44 && box.width >= 44, "Home touch target");
      }
      await nearbyChecks(page, context, language, labels);
      await page.getByTestId("home-scan-action").click();
      await page.getByTestId("scanner-permission-screen").waitFor();
      assert.ok(await page.getByTestId("scanner-permission-manual-action").isVisible());
      await page
        .getByText(language === "fi" ? "Kameran käyttölupa" : "Camera access", { exact: true })
        .waitFor();
      assert.ok((await page.locator("body").innerText()).includes("Open Facts"));
      await shot(page, language + "-camera-purpose");
      await page.emulateMedia({ colorScheme: "dark" });
      await page.waitForFunction(
        () =>
          getComputedStyle(document.getElementById("app-screen-surface")).backgroundColor ===
          "rgb(20, 34, 27)",
      );
      await largeText(page);
      await shot(page, language + "-camera-purpose-dark-large");
      await page.emulateMedia({ colorScheme: "light" });
      await page.getByTestId("scanner-permission-manual-action").click();
      await page.getByTestId("manual-entry-screen").waitFor();
      assert.equal(
        await page.getByTestId("manual-submit-action").getAttribute("aria-disabled"),
        "true",
      );
      await page.getByTestId("manual-gtin-input").fill("123");
      await page.getByTestId("manual-submit-action").focus();
      await page.getByTestId("manual-submit-action").press("Enter");
      await page.getByRole("alert").waitFor();
      assert.equal(requests, 0, "Invalid code never reaches API");
      await shot(page, language + "-manual-invalid");
      for (const state of [
        "not_found",
        "provider_unavailable",
        "offline",
        "packaging_missing",
        "resolved",
      ]) {
        scenario = state;
        await page.goto(baseUrl + "/manual");
        await page.getByTestId("manual-gtin-input").fill(gtin);
        await page.getByTestId("manual-submit-action").click();
        if (state === "not_found") {
          await page.getByTestId("result-loading-screen").waitFor();
          await shot(page, language + "-result-loading");
        }
        await page
          .getByTestId(
            state === "offline"
              ? "result-offline-screen"
              : state === "not_found"
                ? "result-not-found-screen"
                : state === "provider_unavailable"
                  ? "result-provider-unavailable-screen"
                  : "product-result-screen",
          )
          .waitFor();
        if (state === "resolved") {
          await resultDetails(page, language, labels);
        }
        await shot(page, language + "-result-" + state);
        if (state === "resolved" || state === "packaging_missing") {
          await darkMode(page);
          await shot(page, language + "-result-" + state + "-dark");
          await largeText(page);
          await page.setViewportSize({ width: 320, height: 740 });
          if (state === "resolved") await resultDetails(page, language, labels);
          await shot(page, language + "-result-" + state + "-dark-large-320");
          await page.emulateMedia({ colorScheme: "light" });
          await page.setViewportSize({ width: 390, height: 844 });
        }
      }
      await page.goto(baseUrl + "/guide");
      await page.getByRole("heading").first().waitFor();
      await context.setOffline(true);
      assert.equal(await page.getByRole("heading").count(), 5);
      await shot(page, language + "-guide-offline");
      await context.setOffline(false);
      await page.goto(baseUrl + "/component");
      const plastic = page.getByRole("radio", {
        name: language === "fi" ? "Muovi" : "Plastic",
        exact: true,
      });
      await plastic.click();
      assert.equal(await plastic.getAttribute("aria-checked"), "true");
      await page
        .getByRole("radio", { name: language === "fi" ? "Pullo" : "Bottle", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: language === "fi" ? "Näytä ohje" : "Show guidance",
          exact: true,
        })
        .click();
      await page.getByTestId("sorting-result-ambiguous").waitFor();
      await shot(page, language + "-component-ambiguous");
      await darkMode(page);
      await largeText(page);
      await page.setViewportSize({ width: 320, height: 740 });
      await shot(page, language + "-component-ambiguous-dark-large-320");
      await page.emulateMedia({ colorScheme: "light" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(baseUrl + "/material-code");
      await page.getByRole("textbox").fill("05 PP");
      await page
        .getByRole("button", {
          name: language === "fi" ? "Tarkista koodi" : "Check code",
          exact: true,
        })
        .click();
      assert.equal(await page.getByTestId("sorting-result-resolved").count(), 0);
      await page
        .getByRole("button", {
          name:
            language === "fi" ? "Näen tämän koodin pakkauksessa" : "I see this code on the package",
          exact: true,
        })
        .click();
      await page.getByTestId("sorting-result-resolved").waitFor();
      await shot(page, language + "-material-code");
      for (const [code, title, name] of [
        [
          "PAP",
          language === "fi" ? "Koodissa on vielä epäselvyyttä" : "The code is still ambiguous",
          "ambiguous",
        ],
        [
          "not-a-code",
          language === "fi" ? "Koodia ei tunnistettu" : "Code not recognized",
          "unknown",
        ],
      ]) {
        await page.getByRole("textbox").fill(code);
        await page
          .getByRole("button", {
            name: language === "fi" ? "Tarkista koodi" : "Check code",
            exact: true,
          })
          .click();
        await page.getByRole("alert").filter({ hasText: title }).waitFor();
        assert.equal(await page.getByTestId("sorting-result-resolved").count(), 0);
        await shot(page, language + "-material-code-" + name);
      }
      await page.goto(baseUrl + "/history");
      await page
        .getByText(
          language === "fi"
            ? "Hakuja ei tallenneta historiaan."
            : "Lookups are not saved to history.",
          { exact: true },
        )
        .waitFor();
      await shot(page, language + "-history-empty");
      await page
        .getByRole("button", {
          name:
            language === "fi" ? "Tallenna haut tähän laitteeseen" : "Save lookups on this device",
          exact: true,
        })
        .click();
      scenario = "packaging_missing";
      await page.goto(baseUrl + "/manual");
      await page.getByTestId("manual-gtin-input").fill(gtin);
      await page.getByTestId("manual-submit-action").click();
      await page.getByTestId("packaging-missing-result").waitFor();
      await page.goto(baseUrl + "/history");
      await page.getByRole("button", { name: "QA fixture — two parts", exact: true }).waitFor();
      assert.ok(!(await page.locator("body").innerText()).includes("packaging_missing"));
      await shot(page, language + "-history-saved");
      await largeText(page);
      await shot(page, language + "-history-saved-large");
      await page
        .getByRole("button", {
          name:
            language === "fi"
              ? "Lopeta tallennus ja tyhjennä historia"
              : "Stop saving and clear history",
          exact: true,
        })
        .click();
      await page
        .getByText(language === "fi" ? "Ei tallennettuja hakuja." : "No saved lookups.", {
          exact: true,
        })
        .waitFor();
      assert.equal(
        await page.getByRole("button", { name: "QA fixture — two parts", exact: true }).count(),
        0,
      );
      await page.goto(baseUrl + "/feedback");
      await page
        .getByRole("radio", {
          name: language === "fi" ? "Tieto puuttuu" : "Information missing",
          exact: true,
        })
        .click();
      await page
        .getByRole("button", {
          name: language === "fi" ? "Tallenna luonnos laitteelle" : "Save draft on device",
          exact: true,
        })
        .click();
      await page.getByRole("alert").waitFor();
      await page
        .getByText(
          language === "fi" ? "Palautetta ei ole lähetetty." : "Feedback has not been sent.",
          { exact: true },
        )
        .waitFor();
      await shot(page, language + "-feedback-local");
      await page.goto(baseUrl + "/legal");
      await page
        .getByText(language === "fi" ? "Tietojen käyttö" : "Use of information", { exact: true })
        .waitFor();
      assert.doesNotMatch(
        await page.locator("body").innerText(),
        /JURIDISTA TARKISTUSTA|LEGAL REVIEW|Käyttöehdot|Terms of use/,
      );
      assert.match(await page.locator("body").innerText(), /Open Food Facts/);
      await shot(page, language + "-legal");
      for (const route of [
        "",
        "manual",
        "component",
        "feedback",
        "guide",
        "material-code",
        "history",
        "legal",
      ]) {
        await page.goto(baseUrl + "/" + route);
        await page.getByText("KeepItGreen", { exact: true }).first().waitFor();
        await page.emulateMedia({ colorScheme: "dark" });
        await page
          .waitForFunction(
            () =>
              getComputedStyle(document.getElementById("app-screen-surface")).backgroundColor ===
              "rgb(20, 34, 27)",
            null,
            { timeout: 10000 },
          )
          .catch(async (error) => {
            const observed = await page.evaluate(() => ({
              url: location.pathname,
              dark: matchMedia("(prefers-color-scheme: dark)").matches,
              background: getComputedStyle(document.getElementById("app-screen-surface"))
                .backgroundColor,
            }));
            throw new Error(`${error.message}: ${JSON.stringify(observed)}`);
          });
        await shot(page, language + "-dark-" + (route || "home"));
        await largeText(page);
        await shot(page, language + "-large-" + (route || "home"));
        if (route === "") {
          const title = page
            .getByTestId("home-guide-action")
            .getByText(language === "fi" ? "Lajitteluopas" : "Sorting guide", { exact: true });
          assert.ok(
            await title.evaluate((el) => {
              const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
              while (walker.nextNode()) {
                const text = walker.currentNode;
                for (const match of text.textContent.matchAll(/\S+/g)) {
                  const range = document.createRange();
                  range.setStart(text, match.index);
                  range.setEnd(text, match.index + match[0].length);
                  if (range.getClientRects().length > 1) return false;
                }
              }
              return true;
            }),
            "Guide tile title must wrap between words, not orphan a letter at 130% text",
          );
        }
        await page.emulateMedia({ colorScheme: "light" });
      }
      await page.goto(baseUrl);
      await page.setViewportSize({ width: 320, height: 740 });
      await shot(page, language + "-home-320");
      const narrowNearby = await page.getByTestId("home-nearby-action").boundingBox();
      const narrowGuide = await page.getByTestId("home-guide-action").boundingBox();
      assert.ok(
        narrowGuide.y > narrowNearby.y + narrowNearby.height,
        "Narrow navigation tiles stack",
      );
      await page.setViewportSize({ width: 1280, height: 800 });
      await shot(page, language + "-home-wide");
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log(
      "PASS: isolated FI/EN UI flows, invalid-no-request, controlled nearby address/postal lookup/errors/cancel/map/source, missing/unavailable/offline/resolved/unknown, provenance, confirmation, ambiguity, local history/draft/factual privacy, touch targets, dark/130% synthetic text, 320/390/1280 widths. No user GPS or production fixture data.",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e.stack);
  process.exitCode = 1;
});
