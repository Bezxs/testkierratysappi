# Three-part repository partition — 2026-10-12

Baseline `c408a0f`, independent KierratysAppi worktree/branch. Requested scope:
three clear implementation/ownership parts with minimal accidental coupling.
No private KeepItGreen source/design import or GitHub push/settings change.

## What changed

Tracked implementation now lives in three roots:

- `mobile/app` and `mobile/localization`: UI/device/local-state/translation owner.
- `backend/api`, `application`, `data-providers`, `database`: API/provider/cache/schema owner.
- `shared/contracts`, `domain`, `recycling-engine`: pure model/protocol/policy owner.

Moved existing code, not duplicated it. Extracted the application package's lookup/
collection contracts into their own pure shared package. API/mobile import those
public schemas and keep the existing v1 endpoint/method/body/results. Backend
request JSON schema is generated from the shared strict body schema. New part
READMEs/AGENTS and `docs/project/TEAM_STRUCTURE.md` describe responsibilities, commands,
cross-part change/version procedure and separate branch/worktree workflow.

The mandatory AST/import/public-export/DAG guard checks normal/type/import-type/
re-export/require/dynamic imports, undeclared/private/relative escapes, consumer
coupling, UI/server runtime imports, source symlinks and compiler alias/baseUrl
escapes. This is an architecture gate, not a sandbox against a person intentionally
editing the gate. Shared policy/protocol changes can deliberately affect consumers;
folders do not eliminate that. Root tools/CI/lockfile/docs need coordination.

## Automated evidence

- Pinned `pnpm validate`: exit 0, **307 tests = 58 Node policy + 249 Vitest**,
  mandatory boundary guard, format/lint/strict types, nine workspace-package tests,
  API/package builds and 13-route web export. Log: ignored
  `work/three-part-validate-final.log`.
- Vitest counts: domain 52, database 5, localization 6, engine 8, providers 35,
  contracts 15 (12 moved collection cases + 3 new frozen-v1 cases), application 8,
  API 13, mobile 107. Eleven new boundary/graph/compiler/AST/scoping regressions
  pass; prior test coverage is retained across moved packages.
- All scoped commands exit 0: `pnpm validate:mobile` (5 packages / 188 tests),
  `pnpm validate:backend` (7 packages / 136 tests), `pnpm validate:shared`
  (3 packages / 75 tests). Counts overlap because shared dependencies are checked;
  do not add them as new unique tests. Mobile closure contains no backend/database;
  backend scope does not build Expo. Logs: ignored `work/three-part-<part>.log`.
- Offline lockfile regeneration and frozen/offline install pass. The external
  `packages`/`snapshots` sections remain exactly unchanged: no new external runtime
  dependency, version, integrity, release-age exception or provider update. This
  is not a fresh live advisory audit/Doctor pass.
- Independent SHA comparison against baseline confirms OSM JSON, published rules
  and SQL migration byte-identical. No database execution/migration applied to a
  real service; migration tests use their existing isolated PGlite fixture.
- CI source now defines separate mobile/backend/shared matrix jobs plus the
  existing full integration/security gates using unchanged pinned actions.
  No remote run or branch-protection/CODEOWNERS settings are claimed.

## Runtime and visual evidence

- Owned previous API/Metro processes validated by port/PID/cwd before stopping;
  restarted on 3003/8093 from new paths. LAN API health, iOS manifest and exact
  JS asset return HTTP 200. iOS bundle is 11,605,710 bytes with current API/nearby
  code; known backend implementation classes are absent. Static dependency tests
  independently enforce the client/server boundary.
- Both updated actual-Metro browser runners pass FI/EN, barcode/manual/error/
  source/ambiguity/confirmation/local-state/privacy flows, nearby one-press versus
  direct URL, five independently distance-ranked public records/material reports,
  denied/cancelled/timed-out fixes, offline, keyboard/ARIA, light/dark, 130%
  synthetic text and relevant 320/390/1280 widths. They use isolated labelled
  provider fixtures and synthetic public-point GPS, never user GPS/runtime fixtures.
  Logs: `work/three-part-app-browser.log` / `three-part-nearby-browser.log`.
- Updated browser visuals inspected. Existing installed iPhone development client
  launches/reloads against new Metro, shows actual current Finnish Home and passes
  the exact visible nearby-button assertion. Ignored 1284×2778
  `work/three-part-iphone-home.png` inspected; no GPS/camera acquisition or result
  capture. Automation session closed; local API/Metro remain available.
- Web entry `entry-b61bf7712c917bc2619662578e165105.js`: 3,803,444 bytes /
  720,054 gzip, still above the existing warning budget; no speed/battery claim.

## Limits and reproduction

From repository root with pinned pnpm/Node:

```sh
pnpm install --frozen-lockfile
pnpm check:boundaries
pnpm validate:shared
pnpm validate:backend
pnpm validate:mobile
pnpm validate
```

Browser runner paths remain `scripts/qa/`; set the locally installed Playwright/
Chrome module/executable environment variables as documented in prior evidence.
Source/CI/scripts/importer use new paths. Historical dated paths/logs remain
historical; mapping is in TEAM_STRUCTURE. This Mac has an ignored `apps/mobile`
symlink to preserve previous generated Xcode/Pods absolute paths, not duplicated
tracked source. Fresh checkout does not need that link; a later clean native
generation must start in `mobile/app`.

No new Xcode native build/sign/install, wider physical nearby/map/permission/
VoiceOver/Dynamic Type/battery acceptance, database hosting, paid action, live
provider/advisory re-audit, remote CI or publication. Existing profile expires
October 19, 12:49:04 Helsinki. No user contents/credentials were read or deleted.
The remaining latest native flow is still the next action. Sharing/settings need
separate authorization; no remote approvals or personal assignments were configured.
