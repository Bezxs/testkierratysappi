# Finland recycling directory

`finland-recycling.json` is a generated, separate OpenStreetMap-derived database,
not an Open Food Facts/product/sorting-rule database. It is licensed under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/),
© [OpenStreetMap contributors](https://www.openstreetmap.org/copyright).
The repository's source-code licence does not override this data licence.

The public raw query selects `amenity=recycling` within Finland's country area.
The reproducible transformation is `scripts/import-recycling-points.mjs`: retain
point/area-centre coordinates, source ID, optional name/address and access/type;
exclude explicitly restricted, locked, disused, abandoned or conditional-access
sites. Missing access remains unknown. Geometry centres are not entrances.
Import rejects partial/count-mismatched/oversized/malformed responses. It neither
verifies real-world availability nor claims completeness or material suitability.

Refresh manually with `node scripts/import-recycling-points.mjs`, review the data
diff and run validation before release. The API is an occasional development
import source, not an app backend; never issue a query per user/location. The
database's `retrievedAt` and upstream `dataTimestamp` are fetch/data dates, not a
physical inspection. UI warns after 30 days using the older of these two dates.
No GPS coordinates enter this file.

The ODbL-covered normalized database is supplied here in its entirety with its
transformation source. Keep this licence/attribution with any redistribution.
No source logos, map tiles, photos or external provider prose are bundled.
