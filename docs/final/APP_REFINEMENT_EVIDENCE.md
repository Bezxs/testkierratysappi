# Whole-app refinement evidence — 2026-10-08

## Follow-up: whole-app copy cleanup

Following `a406292`, reviewed all eleven functional routes and shared sorting
presentation in Finnish and English. Removed the owner-identified blanket
privacy sentence from both Home and history, the scan-button subtitle,
duplicate error captions and the loading claim of fresh rule review. No
replacement slogan or new design system. Plain wording now describes saved
lookups, offline retry, material-code limitations, nearby errors and unsent
feedback. History's existing disable-and-clear effect is explicit, with a
destructive style; its storage implementation is unchanged.

Camera/barcode and location purposes remain at their relevant actions.
Optional address consent, uncertainty, licences/rule metadata and legal-review
markers remain. Legal/retention drafts, native OS-purpose strings, versioned
sorting content and provider/location infrastructure were not changed.

Validation:

- Full pinned `pnpm validate`: exit 0, **265 tests (41 Node policy + 224
  application)**, formatting/lint/strict types, package/API builds and 13 web
  routes. Log: ignored `work/location-2026-10-06/plain-language-validate.log`.
- Narrow mobile design policy: 9/9. Localization: 6/6. Four new cases protect
  disclosure placement, removal of blanket reassurance/false loading claims,
  explicit history clearing and unsent feedback in both languages.
- Updated whole-app browser runner passes FI/EN, including observed loading,
  invalid input/no API call, missing/unavailable/offline/results, provenance,
  material-code confirmation and ambiguous/unknown states, history opt-in and
  disable/clear, unsent local drafts and legal markers. Test contexts contain
  QA fixtures only; no actual user data was deleted.
- Nearby browser runner passes again with public-point synthetic coordinates,
  offline lookup, uncertainty/metadata, keyboard semantics, dark switching and
  synthetic large text. No user's location was read or captured.
- Inspected updated Home, camera permission, provider failure, material-code
  errors, history and feedback screenshots, plus English/dark/large views and
  nearby dark/large. Camera-purpose and saved-history controls now also have
  130% synthetic-text regression screenshots. Existing Home 320/390/1280 and
  eight reading/form-route FI/EN dark/large checks pass. Screenshot scope is
  the browser viewport inside a scroll container, not a full native capture.
- The first extended QA attempt used an incorrect fixture (`05`, which is a
  recognized numeric code) and was cancelled after checking parser tests.
  Changed to ambiguous `PAP`. The next attempt timed out because an alert's
  text is not its accessible name; corrected the locator to filter alert text.
  Final runner passes; neither test-authoring issue was an app failure.
- Web entry: **3,368,747 bytes / 695,441 gzip**, still above the existing 2 MiB
  warning budget. This is size evidence, not measured performance.

No package/account/paid action, private-repository import, GitHub push or
native build/sign/install. Latest native text/layout, camera, VoiceOver,
Dynamic Type and OS address/map-handoff acceptance remain pending; production
NO-GO and owner gates are unchanged.

## Outcome and scope

Local UI implementation and browser validation complete; latest physical
acceptance and production release remain open. Team-baseline worktree
`codex/kierratysappi-nearest-location`, following `b9c3ac7`. No private
KeepItGreen source/assets imported, package/native dependency change, data
deletion, reinstall, signing renewal or GitHub push.

The requested modest, intentionally made app is implemented without demo
badges. Home, manual, scanner, result, component, material-code, guide, nearby,
history, feedback and legal use the same restrained type/control system.
Native camera changes are limited to styling and torch ARIA semantics.
Provider/sorting/location infrastructure is unchanged.

## Automated evidence

- Full pinned `pnpm validate`: exit 0, **261 tests = 39 Node policy +
  222 application Vitest tests**, formatting/lint/strict types, package/API
  builds and 13-route Expo web export. Final log:
  ignored `work/location-2026-10-06/app-refinement-validate.log`.
- Nine history-presentation cases cover FI/EN status/date, safe unknown/malformed
  date fallback and no verified-sorting claim from product resolution. Three
  new source-policy cases protect shared navigation, scalable/focusable fields,
  reading sections, localized history and legal review. Existing Home policy
  follows labels/semantics through the new shared ActionRow rather than requiring
  duplicated inline Pressables.
- Whole-app optional Playwright runner passes against actual Metro 8093:
  FI/EN Home targets, camera-purpose/manual fallback, empty/invalid code,
  zero API requests for invalid input and Enter activation, not-found,
  provider-unavailable, transport failure, packaging-missing, two-component
  resolved/unknown presentation and full source/licence/version disclosure.
- Actual local component flow remains ambiguous for an unknown deposit mark.
  Material-code recognition cannot show sorting before explicit confirmation.
  Offline guide, opt-in local history (with translated status), local-only saved
  feedback and legal draft markers pass in isolated contexts.
- Home and seven reading/form routes passed live dark switching and 130%
  synthetic web text checks in both languages. No horizontally overflowing or
  clipped layout element. Home also passes 320/390/1280 widths. This synthetic
  scaling does not certify iOS Dynamic Type.
- Existing nearby runner passes FI/EN, public-point synthetic GPS, primary map
  visibility at 390×844, keyboard-expanded metadata, offline local search,
  unknown/approximate cautions, shared dark switching and synthetic large text.
  No user's GPS/address/distance was read or captured.
- Local API health and Metro iOS manifest/launch bundle return HTTP 200;
  development iOS JS bundle is 10,958,874 bytes. No new native execution is
  inferred. Web entry is 3,372,352 bytes / 696,516 gzip, above the existing
  warning budget, not a performance benchmark.

## Reproduction

With the existing project Metro on 8093 and installed local QA tools, set
`PLAYWRIGHT_MODULE_PATH` to the installed Playwright module and
`BROWSER_EXECUTABLE_PATH` to the installed Chrome executable, then run:

```sh
node scripts/qa/app-refinement-browser.cjs
node scripts/qa/nearby-ux-browser.cjs
pnpm validate
```

Optional runners do not add Playwright/browser dependencies to the app.
`APP_QA_URL` / `NEARBY_QA_URL` may override the local origin. Use pnpm 11.16.0
and the supported Node range. QA product/rule/provider names explicitly say
**QA fixture** and use example.test URLs; responses are browser route
interceptions only. They never seed the application, call upstream providers,
or establish real product coverage/licensing acceptance.

## Visual inspection and repairs

Before: inspected the existing phone-width Home/manual/guide/component screens;
repeated brand headers, large marks, technical captions and card stacks were
the identified design pattern. After: visually inspected FI Home, guide,
feedback, product states, component and material code, EN dark manual/Home,
and dark/large layouts. Current screenshots are ignored
`work/app-refinement-qa/*.png`; baseline screenshots are
`work/nearby-ux-qa/before-*.png`. These are browser viewport views inside
native-style scroll containers, not full native-device captures.

- The first browser run had a faulty dark-surface selector; the runner now
  checks the actual Screen surface ID, not the HTML language element.
- Large-text Finnish compound material names overflowed their two-column
  buttons. Flexible text width plus short, ordinary material names repair
  the actual defect; the same overflow assertion now passes.
- The first full validation caught an old inline-Pressable-only Home policy
  assumption after introducing ActionRow. Updated it to verify delegated
  labels/button semantics/test IDs without reducing the acceptance requirement.

## Limits and next acceptance

No new physical iPhone/Android appearance, camera/torch, VoiceOver, Dynamic
Type, native OS address lookup/map handoff, performance or battery pass.
No production archive/release/store/legal approval. The web entry remains above
the existing 2 MiB warning budget; no performance improvement is claimed from
removing decoration. Final entry size is recorded in TEST_EVIDENCE.

Codex next checks the existing iPhone client through Metro 8093, including
light/dark/large text and map/address controls, without recording location-derived
details. Roope handles actual unlock/trust/permission prompts if required.
Existing production NO-GO and named owner actions remain unchanged.
