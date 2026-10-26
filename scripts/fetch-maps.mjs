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
    id: "sunday-malhadinha",
    // Stay at Malhadinha Nova — single location
    center: { lat: 37.963, lng: -7.986 }, zoom: 13,
    route: [
      { lat: 37.9631, lng: -7.9856, type: "hotel" },
    ],
  },
  {
    id: "monday-departure",
    // Malhadinha Nova → Lisbon Airport
    route: [
      { lat: 37.9631, lng: -7.9856, type: "travel" },
      { lat: 38.7742, lng: -9.1336, type: "travel" },
    ],
  },
];

// Decode a Google encoded polyline into [[lat, lng], ...] pairs
function decodePolyline(encoded) {
  const pts = [];
  let i = 0, lat = 0, lng = 0;
  while (i < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(i++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    pts.push([lat / 1e5, lng / 1e5]);
  }
  return pts;
}

// Sample up to maxPts evenly-spaced points from an array
function samplePoints(pts, maxPts) {
  if (pts.length <= maxPts) return pts;
  const step = (pts.length - 1) / (maxPts - 1);
  return Array.from({ length: maxPts }, (_, k) => pts[Math.round(k * step)]);
}

// Fetch actual road polyline via Routes API v2, return as sampled lat/lng pairs
async function getRoutePoints(stops, maxPts = 40) {
  if (stops.length < 2) return null;

  const body = {
    origin:      { location: { latLng: { latitude: stops[0].lat,              longitude: stops[0].lng } } },
    destination: { location: { latLng: { latitude: stops[stops.length-1].lat, longitude: stops[stops.length-1].lng } } },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_UNAWARE",
  };

  if (stops.length > 2) {
    body.intermediates = stops.slice(1, -1).map(p => ({
      location: { latLng: { latitude: p.lat, longitude: p.lng } }
    }));
  }

  const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
    },
    body: JSON.stringify(body),
  });

  const json = await res.json();
  if (!json.routes?.[0]?.polyline?.encodedPolyline) {
    console.warn(`  Routes API error: ${JSON.stringify(json)} — using straight line`);
    return null;
  }
  const decoded = decodePolyline(json.routes[0].polyline.encodedPolyline);
  return samplePoints(decoded, maxPts);
}

async function buildUrl(day) {
  const markers = day.route.map(
    (s) => `&markers=color:${TYPE_COLORS[s.type]}|size:mid|${s.lat},${s.lng}`
  );

  let pathPart = "";
  if (day.route.length >= 2) {
    const routePts = await getRoutePoints(day.route);
    const pathCoords = routePts
      ? routePts.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join("|")
      : day.route.map(p => `${p.lat},${p.lng}`).join("|");
    pathPart = `&path=color:0x1a3a5cCC|weight:4|${pathCoords}`;
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
  // Log URL shape (without key) for debugging
  console.log(`  URL: ${url.replace(KEY, "KEY").substring(0, 600)}`);
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`  Failed: ${res.status} ${res.statusText}`);
    console.error(`  Body: ${body.substring(0, 500)}`);
    process.exit(1);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  console.log(`  Saved ${buf.length} bytes → ${outPath}`);
}

console.log("Map prefetch complete.");
