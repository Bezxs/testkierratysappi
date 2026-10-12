# Database readiness — 2026-10-07

October 8 permission-cycle completion supersedes earlier denial/restoration requests below: owner-assisted Never → While Using change yields native denied explanation/settings control and then a passing ready-only refresh-control check. No further owner permission change is currently requested. Native provider attribution is next; fresh consent, exact result text, physical accuracy and production NO-GO gates remain unresolved. No new external blocker, reinstall or push.

October 8 device-evidence update: two foreground searches reach ready state and same-process background clearing passes. Earlier October 7 automation limitations below are historical. This does not verify point accuracy, opening hours, fresh consent, denied recovery or production database readiness.

This describes the local KierratysAppi feature branch, not a production release.
Source baseline: `39f8aa6`; no newer KeepItGreen code/design. Implementation
`487af03` is installed as a development build; iOS runtime acceptance is pending.

| Need | Actual implementation | Cost and limitation |
| --- | --- | --- |
| Food products | Live Open Food Facts API through validated server adapter | Free public read API; quota, attribution and owner release review apply |
| Other product categories | Official universal routing to Open Beauty Facts, Open Pet Food Facts and Open Products Facts | Free ODbL data; experimental/incomplete coverage, no guarantee for a barcode or packaging |
| Finnish sorting policy | Four packaging rules plus separate Palpa deposit rule, versioned in code; matching five-rule SQL seed | Local/offline, no paid database; content review remains separate |
| Nearby recycling points | Bundled Finland OSM snapshot, 5,753 points, source IDs/coordinates/access uncertainty | Free ODbL database; incomplete, not verified on site; straight-line distance, not routing or material acceptance |
| History and drafts | Optional local AsyncStorage | No server account needed; existing local deletion controls remain |
| Server persistence | 26-table PostgreSQL schema and migration/seed tests in PGlite | Schema exists; **not wired to the runtime API or deployed** |

The current anonymous lookup + local guidance + nearest-point functions do not
need a new always-on database server: product reads use the upstream service,
results have a bounded process-memory cache, and the point database is in the
app. This does **not** make the app Mac-independent: development Metro/API still
run on the Mac. Persistent product/moderation storage, shared quotas, operational
backup/restore and a public HTTPS API remain unimplemented release work.

## Maintenance and reproduction

1. Point data: run `node scripts/import-recycling-points.mjs` only for an
   intentional maintainer refresh; inspect the diff and run `pnpm validate`.
   For an existing downloaded response, pass its file path as the first argument.
   Keep `mobile/app/assets/data/README.md`, the entire normalized JSON and its
   ODbL licence notice together. Do not send a user's location to Overpass.
2. Product data: normal barcode lookups request only bounded identity/packaging
   fields. No bulk product mirror is installed. Source attribution is selected
   from the actual returned database, not the generic routing connector name.
3. Local schema check: `pnpm --filter @kierratysappi/database test` exercises
   migration, RLS flags, immutable rule versions, constraints and idempotent seed
   against temporary embedded PGlite. This is not a production restore drill.
4. Before publication, Roope follows OA-01/02/03/04/06 for hosting/recovery,
   Open Facts usage/contact/licensing, content and privacy approvals. Review all
   newly named barcode recipients in both locale notices and store worksheets.
   GS1 must be explicitly licensed or excluded; KIVO is not silently enabled.

## Validation limits

See `TEST_EVIDENCE.md` for current checks. Unit/contract tests do not verify
phone GPS, native permission UX or whether a point is actually open. Native
build/sign/install and actual native Home/nearby introduction pass. After starting
location the helper's system-modal probe times out; permission/result and broader
GPS acceptance remain unverified. Introductory UI does not validate point accuracy.
No paid service, public deployment or GitHub push occurred.
