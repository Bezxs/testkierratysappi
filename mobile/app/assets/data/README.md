# Finland recycling directory

`finland-recycling.json` is a generated, separate OpenStreetMap-derived database,
not an Open Food Facts/product/sorting-rule database. It is licensed under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/),
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
The repository's source-code licence does not override this data licence.

The public raw query selects `amenity=recycling` within Finland's country area.
The reproducible transformation is `scripts/import-recycling-points.mjs`: retain
point/area-centre coordinates, source ID, optional name/operator/address and access/type;
exclude explicitly restricted, locked, disused, abandoned or conditional-access
sites. Missing access remains unknown. Geometry centres are not entrances.
Import rejects partial/count-mismatched/oversized/malformed responses. It neither
verifies real-world availability nor claims completeness or material suitability.

Version 2 also retains 30 recognized material categories as `reportedMaterials`
and `reportedExclusions`. Only explicit `recycling:* = yes` or `no` reports are
mapped. Missing/unsupported/ambiguous values remain unknown; broad plastic,
glass or metal reports do not imply their packaging-specific subcategories.
The UI reports community-directory acceptance, not reviewed sorting policy or
verified access/opening hours. This remains a separate ODbL database.

Refresh manually with `node scripts/import-recycling-points.mjs`, review the data
diff, run `pnpm exec biome format --write mobile/app/assets/data/finland-recycling.json`
and validation before release. The API is an occasional development
import source, not an app backend; never issue a query per user/location. The
database's `retrievedAt` and upstream `dataTimestamp` are fetch/data dates, not a
physical inspection. UI warns after 30 days using the older of these two dates.
No GPS coordinates enter this file.

To re-normalize an authentic cached raw query, supply its original retrieval
timestamp, for example:

```sh
node scripts/import-recycling-points.mjs /path/to/osm-source.json \
  2026-10-06T18:14:37.385Z
```

Without the date the command fails before writing.
Do not replace the date with today. October 11's v2 enrichment used the genuine
October 6 cache after a live download failed: 5,753 records, 1,925 with at least
one affirmative material report and 292 with explicit exclusions. Neither count
establishes coverage, availability or physical verification.

The ODbL-covered normalized database is supplied here in its entirety with its
transformation source. Keep this licence/attribution with any redistribution.
No source logos, map tiles, photos or external provider prose are bundled.
