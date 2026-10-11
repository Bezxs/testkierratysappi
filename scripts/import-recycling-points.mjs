// Generated OSM data stays separate from product/sorting databases and source-code licensing.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const recyclingQuery =
  '[out:json][timeout:35];area["ISO3166-1"="FI"]["boundary"="administrative"]["admin_level"="2"]->.country;nwr["amenity"="recycling"](area.country);out center tags;out count;';
const limit = 12_000_000;

// Exact affirmative/negative reports only. Do not infer packaging from general material tags.
export const recyclingMaterials = {
  glass: "glass",
  glass_bottles: "glassBottles",
  plastic: "plastic",
  plastic_packaging: "plasticPackaging",
  plastic_bottles: "plasticBottles",
  paper: "paper",
  paper_packaging: "paperPackaging",
  cardboard: "cardboard",
  cartons: "cartons",
  beverage_cartons: "beverageCartons",
  metal: "metal",
  metal_packaging: "metalPackaging",
  small_metal: "smallMetal",
  scrap_metal: "scrapMetal",
  cans: "cans",
  aluminium: "aluminium",
  batteries: "batteries",
  car_batteries: "carBatteries",
  electrical_appliances: "electricalAppliances",
  small_electrical_appliances: "smallElectricalAppliances",
  clothes: "clothes",
  textiles: "textiles",
  shoes: "shoes",
  wood: "wood",
  garden_waste: "gardenWaste",
  food_waste: "foodWaste",
  hazardous_waste: "hazardousWaste",
  fluorescent_tubes: "fluorescentTubes",
  light_bulbs: "lightBulbs",
  tyres: "tyres",
};

function cleanText(value, max) {
  if (typeof value !== "string") return null;
  const text = value.replace(/[\p{Cc}\p{Cf}]/gu, "").trim();
  return text ? text.slice(0, max) : null;
}

export function normalizeRecyclingSnapshot(payload, retrievedAt) {
  if (
    !payload ||
    payload.remark ||
    !Array.isArray(payload.elements) ||
    payload.elements.length > 20_001 ||
    !Number.isFinite(Date.parse(retrievedAt)) ||
    !Number.isFinite(Date.parse(payload.osm3s?.timestamp_osm_base))
  ) {
    throw new Error("Invalid or incomplete OSM snapshot");
  }
  const elements = payload.elements;
  const count = elements.at(-1);
  if (count?.type !== "count" || Number(count.tags?.total) !== elements.length - 1) {
    throw new Error("Missing/mismatched terminal count: refuse partial directory");
  }
  const points = [];
  const seen = new Set();
  for (const element of elements.slice(0, -1)) {
    const tags = element.tags;
    if (
      tags?.amenity !== "recycling" ||
      !["node", "way", "relation"].includes(element.type) ||
      !Number.isSafeInteger(element.id) ||
      element.id <= 0
    ) {
      throw new Error("Unexpected OSM record");
    }
    const id = `${element.type}/${element.id}`;
    if (seen.has(id)) throw new Error("Duplicate OSM record");
    seen.add(id);
    // Missing access remains UNKNOWN; it is never promoted to verified public access.
    if (
      (tags.access !== undefined && !["yes", "public", "permissive"].includes(tags.access)) ||
      tags.locked === "yes" ||
      tags.disused === "yes" ||
      tags.abandoned === "yes" ||
      tags["disused:amenity"] ||
      tags["abandoned:amenity"] ||
      tags["access:conditional"]
    )
      continue;
    const location = element.type === "node" ? element : element.center;
    if (
      !location ||
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lon) ||
      location.lat < 59 ||
      location.lat > 70.2 ||
      location.lon < 19 ||
      location.lon > 32
    ) {
      throw new Error("Missing/out-of-range FI coordinate");
    }
    const street = cleanText(tags["addr:street"], 160);
    const house = cleanText(tags["addr:housenumber"], 30);
    const city = cleanText(tags["addr:city"], 80);
    const streetLine = street ? [street, house].filter(Boolean).join(" ") : null;
    points.push({
      id,
      coordinates: { latitude: location.lat, longitude: location.lon },
      name: cleanText(tags["name:fi"] ?? tags.name, 160),
      operator: cleanText(tags.operator, 160),
      address: cleanText([streetLine, city].filter(Boolean).join(", "), 240),
      access: tags.access === undefined ? "unknown" : "reported_public",
      kind: ["container", "centre"].includes(tags.recycling_type) ? tags.recycling_type : "unknown",
      reportedMaterials: Object.entries(recyclingMaterials)
        .filter(([key]) => tags[`recycling:${key}`] === "yes")
        .map(([, value]) => value),
      reportedExclusions: Object.entries(recyclingMaterials)
        .filter(([key]) => tags[`recycling:${key}`] === "no")
        .map(([, value]) => value),
    });
  }
  if (!points.length) throw new Error("Empty directory");
  return {
    version: 2,
    source: "OpenStreetMap contributors",
    attributionUrl: "https://www.openstreetmap.org/copyright",
    license: "ODbL-1.0",
    licenseUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
    retrievedAt,
    dataTimestamp: payload.osm3s.timestamp_osm_base,
    coverage: "FI",
    points: points.sort((a, b) => a.id.localeCompare(b.id, "en")),
  };
}

async function importSnapshot(inputPath, cachedRetrievedAt) {
  let raw;
  if (inputPath) {
    if (!cachedRetrievedAt || !Number.isFinite(Date.parse(cachedRetrievedAt))) {
      throw new Error(
        "Cached source import requires its original retrieval date as the third argument",
      );
    }
    raw = await readFile(inputPath);
  } else {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(45_000),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "KierratysAppi/0.1 (https://github.com/roopeaal/KierratysAppi)",
      },
      body: new URLSearchParams({ data: recyclingQuery }),
    });
    if (!response.ok || !response.body)
      throw new Error(`OSM download unavailable (${response.status})`);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.byteLength;
      if (size > limit) throw new Error("OSM download exceeds limit");
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks);
  }
  if (raw.byteLength > limit) throw new Error("OSM input exceeds limit");
  const snapshot = normalizeRecyclingSnapshot(
    JSON.parse(raw.toString("utf8")),
    inputPath ? new Date(cachedRetrievedAt).toISOString() : new Date().toISOString(),
  );
  const directory = new URL("../apps/mobile/assets/data/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("finland-recycling.json", directory), `${JSON.stringify(snapshot)}\n`);
  console.log(`Imported ${snapshot.points.length} source-backed points. No user location used.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await importSnapshot(process.argv[2], process.argv[3]);
}
