# Acceptance criteria

## Core vertical slice

1. The user sees why the camera is useful before the OS prompt and can continue with manual entry.
2. A supported barcode is normalized and validated; malformed values never reach a provider.
3. Mobile calls the application API/service rather than Open Food Facts directly.
4. Provider payloads are runtime-validated and normalized with field-level provenance.
5. The sorting engine selects only matching, effective rules and explains the match.
6. Every component result shows destination, preparation, source, checked date, verification, and confidence in text—not color alone.
7. Missing product, missing packaging, ambiguity, offline mode, permission denial, timeout, and provider failure produce distinct recoverable states without fabricated advice.
8. Finnish and English strings render through localization keys; large text and screen-reader labels remain usable.
9. Domain, provider-contract, API-integration, and mobile-state tests pass.

## Material-code flow

1. The user enters one bounded visible packaging code; no image is captured or uploaded.
2. A recognized code shows canonical code, material name, jurisdiction, decision version, source, and checked date before guidance.
3. Sorting begins only after the user explicitly confirms that the recognized code appears on the package.
4. Conflicting, multiple, unknown, and undefined codes never produce guessed guidance; composites without a reviewed rule remain safe unknowns.
5. Recognition provenance and confidence remain distinct from user-confirmed observation and the Finnish sorting-rule provenance.

## Free-data and nearest-point addition

UX refinement acceptance: the map action is primary and fits the standard-size
390×844 browser viewport; technical metadata is expandable with announced state,
while uncertainty, source/licence/date and essential access/material cautions
remain visible. Optional native address lookup discloses public-point transfer
before the action and distinguishes an area estimate from a verified address.
Live theme changes must update text and surfaces together. Browser scaling and
synthetic GPS do not certify native Dynamic Type, VoiceOver or real geocoding.

1. The actual product database name, source link, licence, retrieval date and community uncertainty survive normal lookup, missing-packaging results and cache hits.
2. Universal routing may use only the fixed supported Open Facts origins with one sibling hop, bounded response/deadline and shared quota. Wrong GTIN/type, arbitrary redirect, timeout and quota failure never become a verified product or a false successful miss.
3. The entire bundled OSM database validates at the application boundary and retains licence, source IDs and timestamps. Old upstream data must not look fresh after a new download.
4. Location is requested only after an explicit action, never in the background; allow/deny/services-off/timeout/cancel/retry are recoverable. The watcher is removed and results clear on leaving/backgrounding. No GPS logging, persistence, analytics or API transmission.
5. The UI calls distance a straight-line estimate and discloses approximate fixes, incomplete coverage and unverified access/materials/hours. It never invents coordinates, open status or material suitability.
6. Source/unit/browser evidence is distinct from actual iPhone GPS/permission acceptance. The October 7 build and October 8 basic ready/denial/restoration checks do not establish latest native source/address/map-handoff UI acceptance or on-site distance accuracy; those remain pending.

## Release evidence

October 8 Home-recognition polish requires real labelled navigation controls,
decorative icons excluded from screen-reader focus, visible keyboard focus and
full FI/EN labels without font-scaling caps. Tiles wrap at narrow widths and
adapt to system font scale; wrapping must not orphan a letter at the tested
130% browser size. Scan/manual remain first, followed by nearby/guide/history.
No new slogan, fabricated preview or hidden contextual disclosure. Arithmetic
and browser checks do not establish physical Dynamic Type or VoiceOver.

October 8 copy cleanup requires no blanket privacy slogan on Home/history,
one clear loading/error explanation with actionable recovery, ordinary FI/EN
wording and explicit naming of history's disable-and-clear effect. Camera and
location purposes stay before their actions; material-code confirmation,
uncertainty, source metadata, unsent-feedback status, retention disclosures and
legal review markers must not be removed as cosmetic clutter. Browser copy
checks do not establish latest native text/layout acceptance.

The October 8 whole-app refinement requires consistent labelled back navigation,
a primary scan/manual path before secondary actions, explicit radio selections,
readable FI/EN fields without font-scaling caps, recoverable errors and localized
history dates/statuses. Product identity must not imply verified sorting. All
component/rule/provider attribution and legal-review markers remain. Isolated
browser fixtures must never enter runtime data; no demo labels or fabricated
points, metrics or maturity claims are added. Browser acceptance is separate
from latest native appearance, camera, Dynamic Type and VoiceOver checks.

The owner-selected display name is KeepItGreen in FI/EN visual and accessible UI, default/native locale configuration and current store drafts. The existing technical app identity and local data must survive the update. Source/browser checks do not establish installed launcher naming, renewed signing or cable-disconnected runtime; these need a rebuilt native artifact and device evidence.

The September visual refresh additionally requires scan/manual actions before secondary content, truthful empty-history status, native and web selected-radio semantics, and retention of every component's uncertainty and source evidence. Browser screenshots and source-policy/contrast checks do not satisfy the separate physical dark-mode, largest-text, camera or screen-reader acceptance below. Current results are recorded in `docs/final/design-refresh-evidence.md`.

- `pnpm validate` succeeds from a clean install.
- CI configuration mirrors local validation.
- Expo Doctor and `expo install --check` pass without exclusions or release-age-policy bypasses.
- Signed Android/iOS builds pass the physical camera, accessibility, large-text, reduced-motion, dark-mode, performance, battery and upgrade matrix.
- Production HTTPS API, shared quota controls, PostgreSQL migration/backup/restore, monitoring/alerts and incident contacts have operational evidence.
- Privacy/terms, OFF licensing/account use and Rinki/Palpa rule content have named approvals; store materials/forms are complete and validated.
- Physical-device, signed-build, store, and legal-owner gaps are explicitly blocked rather than claimed complete.
