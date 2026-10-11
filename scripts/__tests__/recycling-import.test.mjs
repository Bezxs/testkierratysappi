import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizeRecyclingSnapshot, recyclingQuery } from "../import-recycling-points.mjs";

const node = { type: "node", id: 1, lat: 60, lon: 25, tags: { amenity: "recycling" } };
const payload = (elements) => ({
  osm3s: { timestamp_osm_base: "2026-10-06T00:00:00Z" },
  elements: [...elements, { type: "count", tags: { total: String(elements.length) } }],
});
const date = "2026-10-06T01:00:00Z";

test("OSM importer rejects partial results, duplicates, bad coordinates and source IDs", () => {
  for (const bad of [
    { ...payload([node]), remark: "timeout" },
    { ...payload([node]), elements: [node] },
    payload([node, node]),
    payload([{ ...node, lat: 90 }]),
    payload([{ ...node, id: "evil" }]),
  ]) {
    assert.throws(() => normalizeRecyclingSnapshot(bad, date));
  }
});
test("OSM material import retains explicit yes/no only, never broad-to-specific inference", () => {
  const result = normalizeRecyclingSnapshot(
    payload([
      {
        ...node,
        tags: {
          amenity: "recycling",
          operator: "Reported operator",
          "recycling:plastic": "yes",
          "recycling:plastic_bottles": "no",
          "recycling:glass": "maybe",
          "recycling:paper": "true",
          "recycling:cardboard": "Yes",
          "recycling:made_up": "yes",
        },
      },
    ]),
    date,
  );
  assert.equal(result.version, 2);
  assert.equal(result.points[0].operator, "Reported operator");
  assert.deepEqual(result.points[0].reportedMaterials, ["plastic"]);
  assert.deepEqual(result.points[0].reportedExclusions, ["plasticBottles"]);
  const empty = normalizeRecyclingSnapshot(payload([node]), date).points[0];
  assert.deepEqual(empty.reportedMaterials, []);
  assert.deepEqual(empty.reportedExclusions, []);
});
test("OSM importer excludes restricted/closed points and preserves unknown access", () => {
  const restricted = ["private", "customers", "no", "permit"].map((access, i) => ({
    ...node,
    id: i + 2,
    tags: { ...node.tags, access },
  }));
  const closed = { ...node, id: 6, tags: { ...node.tags, disused: "yes" } };
  const result = normalizeRecyclingSnapshot(payload([node, ...restricted, closed]), date);
  assert.equal(result.points.length, 1);
  assert.equal(result.points[0].access, "unknown");
  assert.equal(result.points[0].name, null);
});
test("OSM area centres and bounded cleaned labels retain source binding", () => {
  const way = {
    type: "way",
    id: 7,
    center: { lat: 61, lon: 26 },
    tags: {
      amenity: "recycling",
      name: "Test\u202e\u0000",
      access: "yes",
      recycling_type: "centre",
    },
  };
  const result = normalizeRecyclingSnapshot(payload([way]), date);
  assert.equal(result.points[0].id, "way/7");
  assert.equal(result.points[0].name, "Test");
  assert.equal(result.points[0].kind, "centre");
  assert.equal(result.license, "ODbL-1.0");
  assert.equal(result.coverage, "FI");
  assert.match(recyclingQuery, /out count;/u);
});
test("checked-in OSM snapshot is nonempty, finite, unique and explicitly licensed", () => {
  const snapshot = JSON.parse(
    readFileSync(new URL("../../apps/mobile/assets/data/finland-recycling.json", import.meta.url)),
  );
  assert.ok(snapshot.points.length > 0 && snapshot.points.length <= 20_000);
  assert.equal(snapshot.license, "ODbL-1.0");
  assert.equal(new Set(snapshot.points.map((p) => p.id)).size, snapshot.points.length);
  for (const p of snapshot.points) {
    assert.match(p.id, /^(node|way|relation)\/[1-9]\d*$/u);
    assert.ok(Number.isFinite(p.coordinates.latitude) && Number.isFinite(p.coordinates.longitude));
    assert.ok(["unknown", "reported_public"].includes(p.access));
  }
});

test("cached import refuses to pretend a saved source was freshly retrieved", () => {
  const snapshotUrl = new URL(
    "../../apps/mobile/assets/data/finland-recycling.json",
    import.meta.url,
  );
  const before = readFileSync(snapshotUrl, "utf8");
  assert.throws(
    () =>
      execFileSync(
        process.execPath,
        [
          new URL("../import-recycling-points.mjs", import.meta.url).pathname,
          "unused-cached-source.json",
        ],
        { stdio: "pipe" },
      ),
    /original retrieval date/,
  );
  assert.equal(readFileSync(snapshotUrl, "utf8"), before);
  const result = normalizeRecyclingSnapshot(payload([node]), date);
  assert.equal(result.retrievedAt, date);
  assert.equal(result.dataTimestamp, "2026-10-06T00:00:00Z");
});
