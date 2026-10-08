import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Source-policy coverage complements actual browser inspection; it is not a native render test.
test("every native radio also exposes its checked state in the web renderer", () => {
  for (const screen of ["index.tsx", "component.tsx", "feedback.tsx"]) {
    const source = readFileSync(`apps/mobile/src/app/${screen}`, "utf8");
    const radios = [...source.matchAll(/<Pressable\b[\s\S]*?(?=>)/g)].filter(([control]) =>
      control.includes('accessibilityRole="radio"'),
    );
    assert.ok(radios.length > 0);
    for (const [radio] of radios) {
      assert.match(radio, /accessibilityState=\{\{ checked:/);
      assert.match(radio, /aria-checked=\{/);
    }
  }
});

test("redesigned Home retains accessible primary, fallback and utility actions in task order", () => {
  const home = readFileSync("apps/mobile/src/app/index.tsx", "utf8");
  const ids = [
    "home-scan-action",
    "home-manual-action",
    "home-nearby-action",
    "home-guide-action",
    "home-history-action",
  ];
  const positions = ids.map((id) => home.indexOf(`testID="${id}"`));
  assert.ok(positions.every((position) => position >= 0));
  assert.match(home, /aria-checked=\{language === item\}/);
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
  );
  for (const id of ids) {
    const control = [...home.matchAll(/<Pressable\b[\s\S]*?(?=>)|<ActionRow\b[\s\S]*?\/>/g)].find(
      ([source]) => source.includes(`testID="${id}"`),
    );
    assert.ok(control, `missing ${id}`);
    if (control[0].startsWith("<ActionRow")) {
      assert.match(control[0], /label=\{t\(/);
      assert.match(control[0], /onPress=/);
      const ui = readFileSync("apps/mobile/src/components/ui.tsx", "utf8");
      const row = ui.slice(
        ui.indexOf("export function ActionRow"),
        ui.indexOf("export function ChoiceIndicator"),
      );
      assert.match(row, /accessibilityRole="button"/);
      assert.match(row, /accessibilityLabel=\{label\}/);
      assert.match(row, /testID=\{testID\}/);
    } else {
      assert.match(control[0], /accessibilityRole="button"/);
      assert.match(control[0], /accessibilityLabel=/);
    }
  }
});

test("all subpages use the same labelled navigation without repeated brand cards", () => {
  for (const screen of [
    "manual",
    "scan",
    "result",
    "guide",
    "material-code",
    "component",
    "nearby",
    "history",
    "feedback",
    "legal",
  ]) {
    const source = readFileSync(`apps/mobile/src/app/${screen}.tsx`, "utf8");
    assert.match(source, /<PageHeader\b/);
    assert.doesNotMatch(source, /BrandLockup/);
  }
  const ui = readFileSync("apps/mobile/src/components/ui.tsx", "utf8");
  const header = ui.slice(
    ui.indexOf("export function PageHeader"),
    ui.indexOf("export function PageIntro"),
  );
  assert.match(header, /accessibilityLabel=\{backLabel\}/);
  assert.match(ui, /minHeight: controls.minimumTouchTarget/);
});

test("forms preserve readable scalable text and strong focus boundaries", () => {
  for (const screen of ["manual", "material-code", "feedback"]) {
    const source = readFileSync(`apps/mobile/src/app/${screen}.tsx`, "utf8");
    assert.match(source, /palette.borderStrong/);
    assert.match(source, /onFocus=|onFocus =/);
    assert.match(source, /onBlur=|onBlur =/);
    assert.doesNotMatch(source, /maxFontSizeMultiplier=|adjustsFontSizeToFit|numberOfLines=/);
  }
});

test("guide and legal are reading sections and history never prints an internal enum", () => {
  for (const screen of ["guide", "legal"])
    assert.match(readFileSync(`apps/mobile/src/app/${screen}.tsx`, "utf8"), /<DocumentSection/);
  const history = readFileSync("apps/mobile/src/app/history.tsx", "utf8");
  assert.match(history, /t\(historyStatusMessageKey\(entry.resultStatus\)\)/);
  assert.doesNotMatch(history, /\{entry.resultStatus\}/);
  assert.match(readFileSync("apps/mobile/src/app/legal.tsx", "utf8"), /t\("legalReview"\)/);
});

test("embedded sorting presentation retains uncertainty, preparation and all provenance fields", () => {
  const source = readFileSync("apps/mobile/src/components/sorting-result.tsx", "utf8");
  for (const expression of [
    "result.destination.label",
    "result.preparation",
    "result.explanation",
    "result.exceptions",
    "result.nextAction",
    "result.candidateDestinations",
    "result.confidence.score",
    "source.sourceName",
    "source.sourceUrl",
    "source.jurisdiction",
    "source.checkedAt",
    "source.version",
    't("ruleVerificationLabel")',
    't("noApplicableRuleSource")',
  ]) {
    assert.ok(source.includes(expression), `${expression} must remain displayed`);
  }
  assert.match(source, /<RuleReferences sources=\{\[result\.rule\]\}/);
  assert.match(source, /<RuleReferences sources=\{result\.sources\}/);
  assert.doesNotMatch(source, /numberOfLines=|maxFontSizeMultiplier=|overflow: "hidden"/);
});

test("original decorative package marks do not claim an unknown material or enter screen-reader order", () => {
  const source = readFileSync("apps/mobile/src/components/packaging-mark.tsx", "utf8");
  assert.equal((source.match(/importantForAccessibility="no-hide-descendants"/g) ?? []).length, 2);
  assert.equal((source.match(/accessibilityElementsHidden/g) ?? []).length, 2);
  assert.equal((source.match(/aria-hidden/g) ?? []).length, 2);
  assert.match(source, /!material \|\| material === "unknown"/);
  assert.doesNotMatch(source, /setInterval|withRepeat|requestAnimationFrame/);
});

test("privacy purpose stays at the relevant action, not as blanket Home/history reassurance", () => {
  for (const screen of ["index", "history"]) {
    assert.doesNotMatch(
      readFileSync(`apps/mobile/src/app/${screen}.tsx`, "utf8"),
      /privacySummary/,
    );
  }
  const home = readFileSync("apps/mobile/src/app/index.tsx", "utf8");
  assert.match(home, /testID="home-legal-action"/);
  assert.doesNotMatch(home, /scanActionDetail|cameraPurpose/);
  assert.match(readFileSync("apps/mobile/src/app/scan.tsx", "utf8"), /t\("cameraPurpose"\)/);
  const nearby = readFileSync("apps/mobile/src/app/nearby.tsx", "utf8");
  assert.match(nearby, /t\("nearbyIntro"\)/);
  assert.match(nearby, /t\("nearbyAddressConsent"\)/);
  const legal = readFileSync("apps/mobile/src/app/legal.tsx", "utf8");
  for (const key of ["privacyDraft", "nearbyPrivacy", "nearbyAddressDisclosure", "legalReview"])
    assert.ok(legal.includes(`t("${key}")`));
});

test("loading and error states explain the task once without asserting a fresh rule review", () => {
  const result = readFileSync("apps/mobile/src/app/result.tsx", "utf8");
  assert.doesNotMatch(result, /loadingDetail|eyebrow=/);
  assert.match(result, /t\("loading"\)/);
  assert.match(result, /t\("offlineBody"\)/);
  assert.match(result, /testID="result-primary-action"/);
  assert.match(result, /testID="result-secondary-action"/);
  assert.match(readFileSync("apps/mobile/src/app/feedback.tsx", "utf8"), /t\("draftNotSent"\)/);
});
