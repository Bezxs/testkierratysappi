# Free data sources — October 6–7, 2026

Scope: new work on KierratysAppi main baseline `39f8aa6`. No newer
KeepItGreen implementation or artwork was used. No account, paid operation,
terms acceptance or public deployment is performed by this research.

## Source evidence

- [Open Facts universal scanning](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/tutorials/scanning-cosmetics-pet-food-and-other-products.md), accessed October 7: the official experimental API supports `product_type=all` and routes to food, beauty, pet-food or other-products instances. Structured packaging is supported, but coverage and behaviour may change. The documented other-products example is used for the bounded live check, not as bundled fake data.
- [API introduction](https://github.com/openfoodfacts/openfoodfacts-server/blob/main/docs/api/index.md), accessed October 7: reads are public, identified clients and quotas are required; community records carry no completeness or accuracy guarantee. The existing usage/contact/licence release review remains. No bulk download is needed.
- Publisher **Open Food Facts** lists its sister databases under ODbL on the French official open-data portal: [Open Products Facts](https://www.data.gouv.fr/datasets/open-products-facts), [Open Beauty Facts](https://www.data.gouv.fr/datasets/open-beauty-facts), [Open Pet Food Facts](https://www.data.gouv.fr/datasets/open-pet-food-facts), accessed October 7. These are publisher-authored catalogue records, not an unrelated repackaged dataset. Attribution/share-alike apply; zero access price is not an exemption from licence duties. Sister-project image licences were not independently established and those images are excluded.
- [OSM copyright](https://www.openstreetmap.org/copyright), [recycling tag](https://wiki.openstreetmap.org/wiki/Tag:amenity=recycling), [Overpass resource policy](https://dev.overpass-api.de/overpass-doc/en/preface/commons.html), accessed October 6: use the ODbL point database with attribution, not unlicensed map imagery. Public Overpass is used only for a bounded, occasional maintainer import, never a query for every app user. A point is not evidence of opening hours, public access or accepted materials.
- [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/), accessed October 6: use explicit foreground permission and a short balanced-accuracy subscription. Background location/service permissions are not needed.

Direct sister-project website data pages returned crawler notices in the research
browser; no scraping workaround was used. Licensing evidence above is from the
publisher's open-data catalogue and official API documentation.

## Implementation and live evidence

October 6: fixed nationwide Overpass query returned 6,202 source objects.
Validation and exclusion of explicitly restricted/closed points retained 5,753.
Full normalized data plus transformation source are supplied separately under
ODbL. Upstream timestamp and retrieval timestamp are retained; neither is a site
inspection. An unnamed point stays unnamed; unknown access stays unknown.

October 7: the official other-products example returned HTTP 302 to
`fi.openproductsfacts.org`. The original world-host-only allowlist correctly
failed closed. Added exact world/FI/EN sibling-host recognition; the second
request is rebuilt at the fixed world origin, never taken verbatim from Location.
Recheck: food origin 302 → products origin 200 → source **Open Products Facts**,
zero structured packaging components. The correct outcome is missing packaging,
not inferred sorting advice. No product dump, user coordinates or camera image
was downloaded. Beauty/pet-food routing has contract-fixture evidence, not a
separately observed live product match.

One lookup has at most two HTTP reads, one 4.5-second deadline and one shared
12-read/minute process quota. Unknown host/path/barcode, credential-bearing URLs,
redirect loops and inconsistent product types fail closed. Provider fields keep
their actual source name, licence and community uncertainty. No persistent OFF
database, proprietary merge or image reuse is introduced.

## Not freely activated

GS1 Data remains contract/credential/rights-dependent; do not label its mock as a
working fallback. KIVO remains key/usage-approval-dependent (see the earlier
`DATA_SOURCES.md` research). Neither is needed for the current OSM nearest-point
implementation. A hosted API/database still requires an owner-selected account,
region, retention and operations plan even when a vendor offers a free tier.
