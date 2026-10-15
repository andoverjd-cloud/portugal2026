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

const HOTEL = { lat: 38.4024, lng: -122.3609 };

const TYPE_COLORS = {
  winery: "0x6b2737",
  meal: "0xc9a84c",
  travel: "0x94a3b8",
  hotel: "0x2c3e50",
};

// Inline itinerary — kept in sync with lib/itinerary.ts
const days = [
  {
    id: "tuesday",
    center: { lat: 38.465, lng: -122.41 },
    zoom: 11,
    stops: [
      { lat: 38.4024, lng: -122.3609, type: "hotel" },
      { lat: 38.4334, lng: -122.4041, type: "travel" },
      { lat: 38.5012, lng: -122.4178, type: "winery" },
    ],
  },
  {
    id: "wednesday",
    center: { lat: 38.478, lng: -122.415 },
    zoom: 11,
    stops: [
      { lat: 38.5043, lng: -122.4098, type: "winery" },
      { lat: 38.4753, lng: -122.4286, type: "winery" },
      { lat: 38.449, lng: -122.3925, type: "winery" },
    ],
  },
  {
    id: "thursday",
    center: { lat: 38.52, lng: -122.49 },
    zoom: 11,
    stops: [
      { lat: 38.4334, lng: -122.4041, type: "travel" },
      { lat: 38.5748, lng: -122.5512, type: "winery" },
      { lat: 38.578, lng: -122.579, type: "winery" },
      { lat: 38.5791, lng: -122.5541, type: "winery" },
    ],
  },
  {
    id: "friday",
    center: { lat: 38.44, lng: -122.39 },
    zoom: 11,
    stops: [
      { lat: 38.3929, lng: -122.3581, type: "winery" },
      { lat: 38.3714, lng: -122.358, type: "winery" },
      { lat: 38.5305, lng: -122.3869, type: "winery" },
    ],
  },
  {
    id: "saturday",
    center: { lat: 38.497, lng: -122.469 },
    zoom: 13,
    stops: [
      { lat: 38.4971, lng: -122.4693, type: "winery" },
    ],
  },
];

function buildUrl(day) {
  const pinned = day.stops.filter((s) => s.lat && s.type !== "travel");

  const parts = [
    `https://maps.googleapis.com/maps/api/staticmap`,
    `?center=${day.center.lat},${day.center.lng}`,
    `&zoom=${day.zoom}`,
    `&size=640x400`,
    `&scale=2`,
    `&maptype=terrain`,
    `&key=${KEY}`,
    `&markers=color:0x2c3e50|size:mid|${HOTEL.lat},${HOTEL.lng}`,
    ...pinned.map((s) => `&markers=color:${TYPE_COLORS[s.type]}|size:mid|${s.lat},${s.lng}`),
  ];

  if (pinned.length > 0) {
    const pts = [HOTEL, ...pinned, HOTEL];
    parts.push(
      `&path=color:0x6b273799|weight:3|${pts.map((p) => `${p.lat},${p.lng}`).join("|")}`
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
