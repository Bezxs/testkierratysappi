# KeepItGreen

KeepItGreen is a Finnish-first, source-backed packaging sorting app. A user scans or enters an EAN/GTIN; the backend uses Open Facts' public lookup, including bounded routing to its beauty, pet-food and other-products databases, and a versioned rule engine explains available packaging components. Missing and ambiguous data stay explicit—material, shape, and deposit status are never silently guessed. Coverage is incomplete; manual material/code fallbacks remain available.

Previously named KierrätysAppi. The repository name, `@kierratysappi/*` packages, bundle/package identifier, URL scheme and local-storage namespace remain unchanged to preserve development and installed-app continuity. Native launcher names update only after rebuilding and reinstalling; changing the JavaScript UI alone does not relabel an installed binary.

## What works

- Expo SDK 57 app for Finnish and English, camera permission, barcode scanning, manual entry, offline recovery, opt-in app-local history, manual component confirmation, and correction drafts.
- Fastify API with runtime validation, rate limits, secure headers, explicit CORS allowlist, OpenAPI output, privacy-conscious logging, and a POST lookup boundary.
- Open Facts API v3 adapter with one allowlisted sibling hop, a shared deadline/quota, size limit, source-specific attribution/licence, selected fields and defensive packaging normalization.
- Foreground-only nearest-point lookup against a separately licensed, bundled OSM Finland directory (5,753 points). Distance is calculated on-device; no GPS upload/background tracking, route or verified opening/material-acceptance claim. New native permission/GPS acceptance is pending.
- Deterministic Finnish packaging rules sourced from Rinki and Palpa, with component-level provenance, confidence, explanations, and exceptions.
- PostgreSQL migration covering 26 entities, forced row security for sensitive records, and immutable published rule versions. This is a tested schema, **not a deployed or runtime-wired database**; current product caching remains bounded process memory.
- Automated unit, contract, integration, migration, API, mobile-state, build, audit, CodeQL, dependency-review, and secret-scanning gates.

## Local development

Requirements: Node 24 LTS and pnpm 11.16.

```bash
pnpm install --frozen-lockfile
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter @kierratysappi/api dev
pnpm --filter @kierratysappi/mobile start
```

For an Android emulator, set `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000`. A physical device needs an HTTPS development endpoint or the workstation's reachable LAN address. Do not put provider secrets in `EXPO_PUBLIC_*` variables.

Run all local quality gates with:

```bash
pnpm validate
pnpm security:audit
```

September 10's Expo compatibility evidence passed `expo install --check` and Expo Doctor 1.20.1 (20/20); it is not a fresh October diagnostic. The workspace enforces a strict 1,440-minute minimum release age for dependency resolution; do not add exclusions merely to consume a fresh release.

Current data inventory, free-access limitations and refresh procedures:
[`DATABASE_READINESS.md`](docs/final/DATABASE_READINESS.md). The full OSM
directory has its own [ODbL notice](apps/mobile/assets/data/README.md).

The generated API contract is available at `GET /v1/openapi.json`; product lookup is `POST /v1/recycling/lookup` with `{ "gtin": "…", "language": "fi" }`.

## Release boundary

The release decision is NO-GO. No paid EAS build, store submission, database deployment, analytics/crash vendor, map provider, GS1 data feed, or photo upload is activated. Those require the accounts, credentials, contracts, legal decisions, and approvals tracked in `docs/final/OWNER_ACTIONS.md` and `docs/project/RELEASE_READINESS.md`.

The privacy notice and terms shown in the app are clearly marked drafts and must receive Finnish legal review before publication.
