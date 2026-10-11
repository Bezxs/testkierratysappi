# Nearby points and school-scope privacy — 2026-10-11

Scope: independent KierratysAppi worktree, branch
`codex/kierratysappi-nearest-location`, baseline `7e25002`.
No newer private-repository code/design/assets imported; no push, signing/install,
store account, paid action or production publication.

## Evidence

- Pinned `pnpm validate` exits 0: **293 tests = 47 Node source/import-policy +
  246 Vitest** (domain 52, database 5, localization 6, engine 8, providers 35,
  application 20, API 13, mobile 107). Formatting, lint, strict types, package/API
  builds and the 13-route web export pass. Ignored final log:
  `work/nearby-points-validate-2026-10-11-final.log`.
- New regressions: stable five-point distance order/limit/out-of-range/mutation,
  v2 material contract/duplicate/conflict/unknown rejection, exact OSM yes/no
  normalization, cached retrieval-date preservation/refusal before writes,
  consume-once/expiry/backward-clock action intent, complete FI/EN material labels
  and broad-versus-packaging distinction. Source policies follow the extracted
  card boundary and preserve foreground cleanup/optional-address consent,
  visible reports/source date, actionable errors and factual Privacy.
- Narrow importer **6/6** and mobile **107/107** pass. Browser diagnosis also
  found a real light-surface/dark-media mismatch during page loading: the installed
  RN Web useColorScheme reads state then subscribes in an effect without recheck.
  Shared theme now uses React useSyncExternalStore with Appearance, current and
  server snapshots; three pure store cases and the actual repeated-navigation/
  computed-background assertion pass. No native Appearance pass inferred.
- `scripts/qa/nearby-ux-browser.cjs` passes on actual Metro 8093: Home auto-search
  with one press, no direct-URL acquisition, five real IDs in independently
  computed distance order, exact reported/unknown/excluded material text,
  source/date/non-verification, first map within a standard 390×844 viewport,
  keyboard expanded semantics, offline refresh, approximate EN fix, FI/EN,
  live dark, 320/390 widths and 130% synthetic text, denied/cancelled/20-second
  timeout states and watcher cleanup. The first QA assertion incorrectly required
  exactly one browser clearWatch call: installed Expo tears down both position
  and error callbacks. Fixed QA to require cleanup and a fresh cleanup after
  timeout; pure location-session tests still require one application teardown.
- `scripts/qa/app-refinement-browser.cjs` passes both languages, existing barcode/
  result/unknown/provenance/confirmation/local-history/local-draft/recovery flows,
  factual Privacy with no review/terms marker, keyboard/touch targets, repeated
  dark switching, 130% synthetic text and Home 320/390/1280 widths. QA-only
  product fixtures remain isolated from the real app data. Logs:
  `work/nearby-points-browser-2026-10-11-final.log` and
  `work/app-refinement-browser-2026-10-11-final.log`.
- Updated nearby light/dark/large/EN and Privacy screenshots inspected in ignored
  `work/nearby-ux-qa/` / `work/app-refinement-qa/`. Long Finnish material/status
  labels wrap without horizontal overflow. Large text can require vertical
  scrolling; it is not capped. No new decorative motion or endless animation.
- V2 data remains 5,753 genuine October 6 records; 1,925 affirmative-material and
  292 exclusion-bearing records. Live refresh failed, so source dates remain
  October 6 rather than October 11. Source methodology and licence:
  `docs/research/osm-material-reports-2026-10-11.md` and data README.
- Independent comparison against the tracked `7e25002` database confirms all
  5,753 previous IDs/coordinates/names/addresses/access/types and source/licence/
  retrieval/upstream dates unchanged; only version, operator and material reports
  were added. No cached record was replaced by a fabricated or private-source one.

## Reproduction

Use the repository-pinned pnpm 11.16.0 and supported Node 24–26:

```sh
pnpm validate
node --test scripts/__tests__/recycling-import.test.mjs
pnpm --filter @kierratysappi/mobile test
```

With team-baseline Metro serving 8093 and locally installed tools (no new app
dependencies), set `PLAYWRIGHT_MODULE_PATH` to the installed Playwright module
and `BROWSER_EXECUTABLE_PATH` to installed Chrome, then run each runner above.
Optional `NEARBY_QA_URL` / `APP_QA_URL` select another local Metro origin. All
browser location fixes are synthetic coordinates at public directory points;
they are not the owner's GPS. Tests do not press a real phone permission prompt
or send location to an API. Screenshot files are ignored, not committed.

## Limits / remaining work

No latest physical one-press permission/list/layout, real GPS accuracy, VoiceOver,
Dynamic Type, OS reverse-geocoding/map handoff, camera/battery/performance pass,
native release build, live supply-chain/provider audit or remote CI claim.
No uninstall or local-data deletion. Existing profile expiry is October 13,
21:21:19 Helsinki; JS-only work does not renew it. Missing metadata is not a
local permission/credential blocker and cannot become guessed reception.

The exported web entry is still above the existing 2 MiB warning budget; the
larger explicit material directory is not a performance improvement. Exact
post-build entry/gzip measurement is recorded in `TEST_EVIDENCE.md`. Native
acceptance remains the single next action, with Roope handling actual OS prompts
if needed and Codex recording only non-location-derived evidence.

The school task does not require the removed runtime legal-review banner or a
lawyer approval. Factual data-use information remains. Future production/store
approvals and public-release NO-GO are separate and are not silently closed.
