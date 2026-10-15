// Downloads Static Maps images at build time.
// Uses Directions API for actual road routes, falls back to straight line.
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

const days = [
  {
    id: "sunday",
    // Lisbon Airport → Six Senses Douro Valley
    route: [
      { lat: 38.7742, lng: -9.1336, type: "travel" },
      { lat: 41.0881, lng: -7.9064, type: "hotel"  },
    ],
  },
  {
    id: "monday",
    // Single location — Six Senses estate
    center: { lat: 41.09, lng: -7.91 }, zoom: 13,
    route: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
  },
  {
    id: "tuesday",
    center: { lat: 41.09, lng: -7.91 }, zoom: 13,
    route: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
  },
  {
    id: "wednesday",
    // Six Senses → São Lourenço do Barrocal
    route: [
      { lat: 41.0881, lng: -7.9064, type: "travel" },
      { lat: 38.4558, lng: -7.3827, type: "hotel"  },
    ],
  },
  {
    id: "thursday",
    // Barrocal → SAHIDA dinner
    route: [
      { lat: 38.4558, lng: -7.3827, type: "hotel" },
      { lat: 38.4203, lng: -7.5381, type: "meal"  },
    ],
  },
  {
    id: "friday",
    // Barrocal → Malhadinha Nova
    route: [
      { lat: 38.4558, lng: -7.3827, type: "travel" },
      { lat: 37.9631, lng: -7.9856, type: "hotel"  },
    ],
  },
  {
    id: "saturday",
    center: { lat: 37.96, lng: -7.99 }, zoom: 13,
    route: [
      { lat: 37.9631, lng: -7.9856, type: "hotel" },
    ],
  },
  {
    id: "sunday-lisbon",
    // Malhadinha Nova → The Ivens, Lisbon
    route: [
      { lat: 37.9631, lng: -7.9856, type: "travel" },
      { lat: 38.7104, lng: -9.1413, type: "hotel"  },
    ],
  },
  {
    id: "monday-lisbon",
    center: { lat: 38.717, lng: -9.14 }, zoom: 14,
    route: [
      { lat: 38.7104, lng: -9.1413, type: "hotel" },
    ],
  },
];

// Fetch actual road polyline via Directions API
async function getRoutePolyline(stops) {
  if (stops.length < 2) return null;
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const dest   = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const mids   = stops.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|");
  const url    = `https://maps.googleapis.com/maps/api/directions/json`
    + `?origin=${origin}&destination=${dest}`
    + (mids ? `&waypoints=${mids}` : "")
    + `&mode=driving&key=${KEY}`;

  const res  = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK") {
    console.warn(`  Directions API: ${json.status} — using straight line`);
    return null;
  }
  return json.routes[0].overview_polyline.points;
}

async function buildUrl(day) {
  const markers = day.route.map(
    (s) => `&markers=color:${TYPE_COLORS[s.type]}|size:mid|${s.lat},${s.lng}`
  );

  let pathPart = "";
  if (day.route.length >= 2) {
    const polyline = await getRoutePolyline(day.route);
    if (polyline) {
      pathPart = `&path=color:0x1a3a5cCC|weight:4|enc:${encodeURIComponent(polyline)}`;
    } else {
      const pts = day.route.map(p => `${p.lat},${p.lng}`).join("|");
      pathPart = `&path=color:0x1a3a5cCC|weight:4|${pts}`;
    }
  }

  // For multi-stop days let Google auto-fit; for single-location days use explicit center/zoom
  const centerZoom = day.center
    ? `&center=${day.center.lat},${day.center.lng}&zoom=${day.zoom}`
    : `&size=640x400`; // will be overridden by auto-fit when path/markers present

  return [
    `https://maps.googleapis.com/maps/api/staticmap`,
    `?size=640x400`,
    `&scale=2`,
    `&maptype=terrain`,
    day.center ? `&center=${day.center.lat},${day.center.lng}&zoom=${day.zoom}` : "",
    `&key=${KEY}`,
    ...markers,
    pathPart,
  ].join("");
}

for (const day of days) {
  const url = await buildUrl(day);
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
