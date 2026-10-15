// Downloads Static Maps images at build time so Google is hit once per deploy,
// not once per visitor. Images land in public/maps/ and are served from Vercel CDN.
// Same approach as napa2026: terrain map, markers, straight-line path.
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

// Each day: stops with lat/lng/type shown as markers.
// For single-location days, no path is drawn.
// For travel days covering large distances, omit the path line (too distorted at scale).
const days = [
  {
    id: "sunday",
    center: { lat: 39.9, lng: -7.8 },
    zoom: 7,
    stops: [
      { lat: 38.7742, lng: -9.1336, type: "travel" },  // Lisbon Airport
      { lat: 41.0881, lng: -7.9064, type: "hotel"  },  // Six Senses
    ],
    drawPath: false,  // too far apart — skip path line
  },
  {
    id: "monday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
    drawPath: false,
  },
  {
    id: "tuesday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
    drawPath: false,
  },
  {
    id: "wednesday",
    center: { lat: 39.8, lng: -7.5 },
    zoom: 7,
    stops: [
      { lat: 41.0881, lng: -7.9064, type: "travel" },  // Six Senses (depart)
      { lat: 38.4558, lng: -7.3827, type: "hotel"  },  // Barrocal
    ],
    drawPath: false,  // too far apart
  },
  {
    id: "thursday",
    center: { lat: 38.44, lng: -7.47 },
    zoom: 11,
    stops: [
      { lat: 38.4558, lng: -7.3827, type: "hotel" },  // Barrocal
      { lat: 38.4203, lng: -7.5381, type: "meal"  },  // SAHIDA (~15km)
    ],
    drawPath: true,
  },
  {
    id: "friday",
    center: { lat: 38.2, lng: -7.7 },
    zoom: 9,
    stops: [
      { lat: 38.4558, lng: -7.3827, type: "travel" },  // Barrocal (depart)
      { lat: 37.9631, lng: -7.9856, type: "hotel"  },  // Malhadinha Nova
    ],
    drawPath: false,  // too far apart
  },
  {
    id: "saturday",
    center: { lat: 37.96, lng: -7.99 },
    zoom: 13,
    stops: [
      { lat: 37.9631, lng: -7.9856, type: "hotel" },
    ],
    drawPath: false,
  },
  {
    id: "sunday-lisbon",
    center: { lat: 38.35, lng: -8.1 },
    zoom: 8,
    stops: [
      { lat: 37.9631, lng: -7.9856, type: "travel" },  // Malhadinha Nova
      { lat: 38.7104, lng: -9.1413, type: "hotel"  },  // The Ivens
    ],
    drawPath: false,  // too far apart
  },
  {
    id: "monday-lisbon",
    center: { lat: 38.717, lng: -9.14 },
    zoom: 14,
    stops: [
      { lat: 38.7104, lng: -9.1413, type: "hotel" },
    ],
    drawPath: false,
  },
];

function buildUrl(day) {
  const pinned = day.stops.filter((s) => s.lat);

  const parts = [
    `https://maps.googleapis.com/maps/api/staticmap`,
    `?center=${day.center.lat},${day.center.lng}`,
    `&zoom=${day.zoom}`,
    `&size=640x400`,
    `&scale=2`,
    `&maptype=terrain`,
    `&key=${KEY}`,
    ...pinned.map((s) => `&markers=color:${TYPE_COLORS[s.type]}|size:mid|${s.lat},${s.lng}`),
  ];

  if (day.drawPath && pinned.length > 1) {
    parts.push(
      `&path=color:0x1a3a5c99|weight:3|${pinned.map((p) => `${p.lat},${p.lng}`).join("|")}`
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
