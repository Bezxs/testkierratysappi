# OSM collection-material reports

Source inspected October 11, 2026:
[OpenStreetMap recycling tagging](https://wiki.openstreetmap.org/wiki/Tag:amenity%3Drecycling).
Revalidation was needed because the requested material display depends on exact
tag meaning; this is not another general provider/competitor study.

The primary reference documents `amenity=recycling`, container/centre types and
material-specific `recycling:*` reports. General plastic, plastic packaging and
plastic bottles are distinct categories; glass and glass bottles/jars are also
distinct. Import 30 recognized categories at the boundary using exact `yes`
and `no` values. Keep unsupported/missing/ambiguous values unknown. Do not expand
one category into another, infer deposit eligibility or nationwide sorting rules,
or turn an unreported category into a negative report. Explicit exclusions stay
visible even when affirmative categories are absent.

Material reports, names, operators, addresses and access are community data,
not independently verified reception. The normalized application contract is
separate from packaging observations/sorting policy and raw OSM response shapes.
Shared source/licence/date/non-verification labels precede the nearest-point list;
point source IDs and details remain accessible. ODbL attribution and the complete
derived database plus transformation remain supplied with the repository.

October 11 live import failed with “OSM download unavailable”; the HTTP status
was not captured in that attempt. The importer now includes status for subsequent
failures. No failed download overwrote the database. Re-normalized authentic
`work/location-2026-10-06/osm-source.json`, whose terminal count is 6,202 and raw
timestamp matches the existing database. Preserved retrieval date
`2026-10-06T18:14:37.385Z` and upstream date `2026-10-06T18:09:46Z`, rather than
calling the cached data fresh. Filtering still yields 5,753 records, 1,925 with
affirmative material reports and 292 with exclusions. No GPS query, paid account,
bulk address enrichment, fabricated record or new backend was introduced.
