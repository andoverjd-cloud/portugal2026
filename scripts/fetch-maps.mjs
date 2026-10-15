// Downloads Static Maps images at build time.
// For multi-stop days, fetches actual road routes via Directions API.
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

const COLORS = {
  hotel:    "0x1a3a5c",
  activity: "0x1a3a5c",
  meal:     "0xc4622d",
  travel:   "0x94a3b8",
};

// For each day: stops with lat/lng/type, map center & zoom.
// route: array of {lat,lng} waypoints to drive between (in order).
// If route is empty, just shows pins with no path.
const days = [
  {
    id: "sunday",
    center: { lat: 39.8, lng: -8.5 },
    zoom: 6,
    pins: [
      { lat: 38.7742, lng: -9.1336, type: "travel", label: "LIS" },
      { lat: 41.0881, lng: -7.9064, type: "hotel",  label: "SS"  },
    ],
    route: [
      { lat: 38.7742, lng: -9.1336 },
      { lat: 41.0881, lng: -7.9064 },
    ],
  },
  {
    id: "monday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    pins: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
    route: [],
  },
  {
    id: "tuesday",
    center: { lat: 41.09, lng: -7.91 },
    zoom: 13,
    pins: [
      { lat: 41.0881, lng: -7.9064, type: "hotel" },
    ],
    route: [],
  },
  {
    id: "wednesday",
    center: { lat: 39.8, lng: -7.7 },
    zoom: 7,
    pins: [
      { lat: 41.0881, lng: -7.9064, type: "travel", label: "SS"  },
      { lat: 38.4558, lng: -7.3827, type: "hotel",  label: "SLB" },
    ],
    route: [
      { lat: 41.0881, lng: -7.9064 },
      { lat: 38.4558, lng: -7.3827 },
    ],
  },
  {
    id: "thursday",
    center: { lat: 38.44, lng: -7.47 },
    zoom: 11,
    pins: [
      { lat: 38.4558, lng: -7.3827, type: "hotel" },
      { lat: 38.4203, lng: -7.5381, type: "meal"  },
    ],
    route: [
      { lat: 38.4558, lng: -7.3827 },
      { lat: 38.4203, lng: -7.5381 },
    ],
  },
  {
    id: "friday",
    center: { lat: 38.2,  lng: -7.7 },
    zoom: 9,
    pins: [
      { lat: 38.4558, lng: -7.3827, type: "travel", label: "SLB" },
      { lat: 37.9631, lng: -7.9856, type: "hotel",  label: "MN"  },
    ],
    route: [
      { lat: 38.4558, lng: -7.3827 },
      { lat: 37.9631, lng: -7.9856 },
    ],
  },
  {
    id: "saturday",
    center: { lat: 37.96, lng: -7.99 },
    zoom: 13,
    pins: [
      { lat: 37.9631, lng: -7.9856, type: "hotel" },
    ],
    route: [],
  },
  {
    id: "sunday-lisbon",
    center: { lat: 38.35, lng: -8.57 },
    zoom: 8,
    pins: [
      { lat: 37.9631, lng: -7.9856, type: "travel", label: "MN"  },
      { lat: 38.7104, lng: -9.1413, type: "hotel",  label: "LIS" },
    ],
    route: [
      { lat: 37.9631, lng: -7.9856 },
      { lat: 38.7104, lng: -9.1413 },
    ],
  },
  {
    id: "monday-lisbon",
    center: { lat: 38.717, lng: -9.14 },
    zoom: 13,
    pins: [
      { lat: 38.7104, lng: -9.1413, type: "hotel" },
    ],
    route: [],
  },
];

// Fetch actual road polyline from Directions API
async function getRoutePolyline(waypoints) {
  if (waypoints.length < 2) return null;
  const origin = `${waypoints[0].lat},${waypoints[0].lng}`;
  const destination = `${waypoints[waypoints.length - 1].lat},${waypoints[waypoints.length - 1].lng}`;
  const mids = waypoints.slice(1, -1).map(p => `${p.lat},${p.lng}`).join("|");
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}${mids ? `&waypoints=${mids}` : ""}&mode=driving&key=${KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK") {
    console.warn(`  Directions API: ${json.status} — falling back to straight line`);
    return null;
  }
  // overview_polyline covers the entire route
  return json.routes[0].overview_polyline.points;
}

async function buildMap(day) {
  const markerParts = day.pins.map((p) => {
    const label = p.label ? `|label:${p.label}` : "";
    return `&markers=color:${COLORS[p.type]}|size:mid${label}|${p.lat},${p.lng}`;
  });

  let pathPart = "";
  if (day.route.length >= 2) {
    const polyline = await getRoutePolyline(day.route);
    if (polyline) {
      // enc: prefix tells Static Maps the path is an encoded polyline
      pathPart = `&path=color:0x1a3a5cCC|weight:4|enc:${encodeURIComponent(polyline)}`;
    } else {
      // fallback: straight line
      const pts = day.route.map(p => `${p.lat},${p.lng}`).join("|");
      pathPart = `&path=color:0x1a3a5cCC|weight:4|${pts}`;
    }
  }

  return [
    `https://maps.googleapis.com/maps/api/staticmap`,
    `?center=${day.center.lat},${day.center.lng}`,
    `&zoom=${day.zoom}`,
    `&size=640x400`,
    `&scale=2`,
    `&maptype=roadmap`,
    `&style=feature:poi|visibility:off`,
    `&style=feature:transit|visibility:off`,
    `&key=${KEY}`,
    ...markerParts,
    pathPart,
  ].join("");
}

for (const day of days) {
  const url = await buildMap(day);
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
