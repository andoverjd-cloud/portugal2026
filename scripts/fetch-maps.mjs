// Downloads Static Maps images at build time so Google is hit once per deploy,
// not once per visitor. Images land in public/maps/ and are served from Vercel CDN.
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public/maps");
mkdirSync(OUT_DIR, { recursive: true });

const KEY = process.env.GOOGLE_MAPS_API_KEY;
if (!KEY) {
  console.error("GOOGLE_MAPS_API_KEY is not set — skipping map prefetch");
  process.exit(0);
}

const TYPE_COLORS = {
  hotel:    "0x1a3a5c",
  activity: "0x1a3a5c",
  meal:     "0xc4622d",
  travel:   "0x94a3b8",
};

// Portugal days — kept in sync with lib/itinerary.ts
const days = [
  {
    id: "sunday",
    center: { lat: 41.1, lng: -7.9 },
    zoom: 8,
    stops: [
      { lat: 38.7742, lng: -9.1336, type: "travel" },  // Lisbon Airport
      { lat: 41.0881, lng: -7.9064, type: "hotel" },   // Six Senses
    ],
  },
  {
    id: "monday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
  },
  {
    id: "tuesday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
  },
  {
    id: "wednesday",
    center: { lat: 39.8, lng: -7.6 },
    zoom: 7,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "travel" },  // Six Senses (depart)
      { lat: 38.4558, lng: -7.3827, type: "hotel" },   // Barrocal
    ],
  },
  {
    id: "thursday",
    center: { lat: 38.44, lng: -7.47 },
    zoom: 11,
    stops: [
      { lat: 38.4558, lng: -7.3827, type: "hotel" },
      { lat: 38.4203, lng: -7.5381, type: "meal" },    // SAHIDA
    ],
  },
  {
    id: "friday",
    center: { lat: 38.2, lng: -7.7 },
    zoom: 9,
    stops: [
      { lat: 38.4558, lng: -7.3827, type: "travel" },  // Barrocal (depart)
      { lat: 37.9631, lng: -7.9856, type: "hotel" },   // Malhadinha Nova
    ],
  },
  {
    id: "saturday",
    center: { lat: 37.96, lng: -7.99 },
    zoom: 13,
    stops: [
      { lat: 37.9631, lng: -7.9856, type: "hotel" },
    ],
  },
  {
    id: "sunday-lisbon",
    center: { lat: 38.35, lng: -8.57 },
    zoom: 8,
    stops: [
      { lat: 37.9631, lng: -7.9856, type: "travel" },  // Malhadinha (depart)
      { lat: 38.7104, lng: -9.1413, type: "hotel" },   // The Ivens
    ],
  },
  {
    id: "monday-lisbon",
    center: { lat: 38.717, lng: -9.14 },
    zoom: 13,
    stops: [
      { lat: 38.7104, lng: -9.1413, type: "hotel" },
    ],
  },
];

function buildUrl(day) {
  const pinned = day.stops.filter((s) => s.lat && s.type !== "travel");
  const travelPins = day.stops.filter((s) => s.type === "travel" && s.lat);

  const parts = [
    `https://maps.googleapis.com/maps/api/staticmap`,
    `?center=${day.center.lat},${day.center.lng}`,
    `&zoom=${day.zoom}`,
    `&size=640x400`,
    `&scale=2`,
    `&maptype=terrain`,
    `&key=${KEY}`,
    ...pinned.map((s) => `&markers=color:${TYPE_COLORS[s.type]}|size:mid|${s.lat},${s.lng}`),
    ...travelPins.map((s) => `&markers=color:${TYPE_COLORS.travel}|size:small|${s.lat},${s.lng}`),
  ];

  if (day.stops.length > 1) {
    parts.push(
      `&path=color:0x1a3a5c99|weight:3|${day.stops.map((p) => `${p.lat},${p.lng}`).join("|")}`
    );
  }

  return parts.join("");
}

for (const day of days) {
  const url = buildUrl(day);
  const outPath = join(OUT_DIR, `${day.id}.png`);
  console.log(`Fetching map for ${day.id}…`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`  Failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  console.log(`  Saved ${buf.length} bytes → ${outPath}`);
}

console.log("Map prefetch complete.");
