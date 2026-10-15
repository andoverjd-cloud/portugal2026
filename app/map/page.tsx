"use client";

import { useState } from "react";

type DayKey = "tue" | "wed" | "thu" | "fri" | "sat";

// ─── SVG coordinate system ───────────────────────────────────────────────────
// viewBox 0 0 440 660
// North (Calistoga) = top, South (Napa city) = bottom
// Left = Mayacamas Range (west), Right = Vaca Mountains (east)
// Valley floor runs north-south through the center

// Valley floor shape — the navigable corridor
const VALLEY =
  "M 160,105 L 134,240 122,310 118,370 120,432 134,558 L 242,558 264,432 270,370 270,310 262,240 240,105 Z";

// Hwy 29 (solid) runs west-side of valley floor
const HWY29 = "M 172,108 L 150,240 140,310 136,370 138,432 150,558";
// Silverado Trail (dashed) runs east-side
const SILVERADO = "M 228,108 L 250,240 260,310 262,370 260,432 250,558";

// ─── AVA Region polygons ─────────────────────────────────────────────────────
const REGIONS: Record<string, { path: string; label: string; lx: number; ly: number; angle: number }> = {
  diamond: {
    path: "M 0,0 L 160,105 C 150,140 138,168 126,205 L 62,202 36,162 10,112 0,68 Z",
    label: "Diamond Mountain",
    lx: 62, ly: 128, angle: -68,
  },
  spring: {
    path: "M 0,68 L 36,162 62,202 126,205 L 122,315 L 50,330 0,278 Z",
    label: "Spring Mountain",
    lx: 48, ly: 262, angle: -75,
  },
  mtveeder: {
    path: "M 0,278 L 50,330 122,315 L 118,435 L 46,468 0,435 Z",
    label: "Mt. Veeder",
    lx: 40, ly: 402, angle: -75,
  },
  howell: {
    path: "M 440,0 L 240,105 L 262,172 264,240 L 335,198 385,150 440,92 Z",
    label: "Howell Mountain",
    lx: 365, ly: 130, angle: 72,
  },
  atlas: {
    path: "M 440,92 L 385,150 335,198 264,240 L 270,312 272,372 L 350,358 408,305 440,248 Z",
    label: "Atlas Peak",
    lx: 368, ly: 300, angle: 75,
  },
};

// ─── Background mountain fill (everything outside the valley) ────────────────
const MTN_WEST =
  "M 0,0 L 160,105 134,240 122,310 118,370 120,432 134,558 L 0,660 Z";
const MTN_EAST =
  "M 440,0 L 240,105 262,240 270,310 270,370 264,432 242,558 L 440,660 Z";

// ─── Towns ───────────────────────────────────────────────────────────────────
const TOWNS = [
  { x: 200, y: 110, name: "CALISTOGA" },
  { x: 198, y: 252, name: "ST. HELENA" },
  { x: 196, y: 318, name: "RUTHERFORD" },
  { x: 194, y: 375, name: "OAKVILLE" },
  { x: 192, y: 438, name: "YOUNTVILLE" },
  { x: 188, y: 565, name: "NAPA" },
];

// ─── Day data ────────────────────────────────────────────────────────────────
const DAYS: { key: DayKey; label: string; title: string; subtitle: string; regions: string[] }[] = [
  {
    key: "tue",
    label: "Tue · Nov 3",
    title: "Arrival Day",
    subtitle: "Base of Howell Mountain",
    regions: ["howell"],
  },
  {
    key: "wed",
    label: "Wed · Nov 4",
    title: "Howell + Valley Floor",
    subtitle: "St. Helena · Rutherford",
    regions: ["howell"],
  },
  {
    key: "thu",
    label: "Thu · Nov 5",
    title: "Diamond Mountain",
    subtitle: "Mayacamas spine · Calistoga",
    regions: ["diamond"],
  },
  {
    key: "fri",
    label: "Fri · Nov 6",
    title: "Mt. Veeder + Valley South",
    subtitle: "Southern Mayacamas · Oakville floor",
    regions: ["mtveeder"],
  },
  {
    key: "sat",
    label: "Sat · Nov 7",
    title: "St. Helena",
    subtitle: "Final morning · then San Francisco",
    regions: [],
  },
];

const DAY_STOPS: Record<DayKey, { x: number; y: number; name: string; confirmed?: boolean; isHotel?: boolean }[]> = {
  tue: [
    { x: 192, y: 435, name: "Hotel Yountville", isHotel: true },
    { x: 186, y: 380, name: "Oakville Grocery" },
    { x: 294, y: 248, name: "Aonair", confirmed: true },
  ],
  wed: [
    { x: 192, y: 435, name: "Hotel Yountville", isHotel: true },
    { x: 291, y: 238, name: "Amizetta", confirmed: true },
    { x: 180, y: 258, name: "Wheeler Farm", confirmed: true },
    { x: 262, y: 318, name: "The Terraces", confirmed: true },
  ],
  thu: [
    { x: 192, y: 435, name: "Hotel Yountville", isHotel: true },
    { x: 186, y: 380, name: "Oakville Grocery" },
    { x: 116, y: 148, name: "Reverie", confirmed: true },
    { x: 172, y: 122, name: "Collateral", confirmed: true },
    { x: 104, y: 164, name: "Diamond Mtn", confirmed: true },
  ],
  fri: [
    { x: 192, y: 435, name: "Hotel Yountville", isHotel: true },
    { x: 162, y: 450, name: "Oasis by Hoopes" },
    { x: 72, y: 468, name: "Progeny", confirmed: true },
    { x: 308, y: 258, name: "Surprise 🎁" },
  ],
  sat: [
    { x: 192, y: 435, name: "Hotel Yountville", isHotel: true },
    { x: 148, y: 268, name: "Clif Family", confirmed: true },
  ],
};

export default function MapPage() {
  const [activeDay, setActiveDay] = useState<DayKey>("tue");
  const day = DAYS.find((d) => d.key === activeDay)!;
  const stops = DAY_STOPS[activeDay];
  const wineryStops = stops.filter((s) => !s.isHotel);

  return (
    <div
      style={{
        fontFamily: "'Georgia', 'Playfair Display', serif",
        background: "#f7f2e8",
        minHeight: "100vh",
        padding: "2rem 1rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.7rem", letterSpacing: "0.3em", color: "#9b7a62", textTransform: "uppercase", margin: 0 }}>
          November 2026
        </p>
        <h1 style={{ fontSize: "1.8rem", color: "#6b2737", margin: "0.25rem 0 0" }}>
          Napa Valley
        </h1>
      </div>

      {/* Day selector */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            style={{
              padding: "0.4rem 0.9rem",
              borderRadius: "2rem",
              border: `2px solid ${activeDay === d.key ? "#6b2737" : "#d4c5a9"}`,
              background: activeDay === d.key ? "#6b2737" : "white",
              color: activeDay === d.key ? "white" : "#6b2737",
              cursor: "pointer",
              fontSize: "0.75rem",
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Active day label */}
      <div style={{ textAlign: "center", marginBottom: "1rem" }}>
        <div style={{ fontSize: "1rem", color: "#6b2737", fontWeight: "bold" }}>{day.title}</div>
        <div style={{ fontSize: "0.8rem", color: "#9b7a62", fontStyle: "italic" }}>{day.subtitle}</div>
      </div>

      {/* SVG Map */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg
          viewBox="0 0 440 660"
          style={{
            width: "min(420px, 100%)",
            height: "auto",
            borderRadius: "1rem",
            boxShadow: "0 4px 24px rgba(107,39,55,0.12)",
          }}
        >
          <defs>
            <pattern id="hatch-w" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#b0a48c" strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <pattern id="hatch-e" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#b0a48c" strokeWidth="0.6" opacity="0.5" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Canvas background */}
          <rect width="440" height="660" fill="#ede5d4" />

          {/* Mountain base fill */}
          <path d={MTN_WEST} fill="#c8bca8" />
          <path d={MTN_EAST} fill="#c8bca8" />

          {/* Mountain hatching */}
          <path d={MTN_WEST} fill="url(#hatch-w)" />
          <path d={MTN_EAST} fill="url(#hatch-e)" />

          {/* AVA region highlights */}
          {Object.entries(REGIONS).map(([key, r]) => {
            const isActive = day.regions.includes(key);
            return (
              <path
                key={key}
                d={r.path}
                fill={isActive ? "#6b2737" : "#b8ac98"}
                opacity={isActive ? 0.45 : 0.2}
              />
            );
          })}

          {/* Valley floor */}
          <path d={VALLEY} fill="#f5efe0" />
          <path d={VALLEY} fill="none" stroke="#c8b898" strokeWidth="0.8" />

          {/* Roads */}
          <path d={HWY29} fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
          <path d={SILVERADO} fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="5,4" opacity="0.55" />

          {/* Active region border glow */}
          {Object.entries(REGIONS)
            .filter(([key]) => day.regions.includes(key))
            .map(([key, r]) => (
              <path
                key={`glow-${key}`}
                d={r.path}
                fill="none"
                stroke="#6b2737"
                strokeWidth="2"
                opacity="0.5"
                filter="url(#glow)"
              />
            ))}

          {/* Region labels */}
          {Object.entries(REGIONS).map(([key, r]) => {
            const isActive = day.regions.includes(key);
            return (
              <text
                key={`lbl-${key}`}
                x={r.lx}
                y={r.ly}
                fontSize={isActive ? "9.5" : "8.5"}
                fill={isActive ? "#6b2737" : "#7a6e60"}
                fontWeight={isActive ? "bold" : "normal"}
                textAnchor="middle"
                fontFamily="Georgia, serif"
                opacity={isActive ? 1 : 0.65}
                transform={`rotate(${r.angle}, ${r.lx}, ${r.ly})`}
                letterSpacing="0.5"
              >
                {r.label.toUpperCase()}
              </text>
            );
          })}

          {/* Mountain range labels */}
          <text x="24" y="340" fontSize="11" fill="#6a5c4e" fontFamily="Georgia, serif" fontStyle="italic"
            transform="rotate(-90, 24, 340)" textAnchor="middle" opacity="0.55" letterSpacing="1">
            MAYACAMAS RANGE
          </text>
          <text x="416" y="340" fontSize="11" fill="#6a5c4e" fontFamily="Georgia, serif" fontStyle="italic"
            transform="rotate(90, 416, 340)" textAnchor="middle" opacity="0.55" letterSpacing="1">
            VACA MOUNTAINS
          </text>

          {/* Towns */}
          {TOWNS.map((t) => (
            <g key={t.name}>
              <circle cx={t.x} cy={t.y - 6} r="2.5" fill="#7a6858" />
              <text x={t.x + 5} y={t.y - 3} fontSize="7" fill="#5e5044"
                fontFamily="Georgia, serif" letterSpacing="0.8" opacity="0.9">
                {t.name}
              </text>
            </g>
          ))}

          {/* Stop markers */}
          {stops.map((stop, i) => {
            const idx = wineryStops.indexOf(stop) + 1;
            return (
              <g key={i}>
                {/* Pulse ring for active confirmed stops */}
                {!stop.isHotel && stop.confirmed && (
                  <circle cx={stop.x} cy={stop.y} r="10" fill="#6b2737" opacity="0.12" />
                )}
                <circle
                  cx={stop.x}
                  cy={stop.y}
                  r={stop.isHotel ? 7 : 6}
                  fill={stop.isHotel ? "#2c3e50" : "#6b2737"}
                  stroke="white"
                  strokeWidth="1.8"
                />
                {stop.isHotel ? (
                  <text x={stop.x} y={stop.y + 4} fontSize="8" fill="white" textAnchor="middle">⌂</text>
                ) : (
                  <text x={stop.x} y={stop.y + 3.5} fontSize="7.5" fill="white" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold">
                    {idx}
                  </text>
                )}
              </g>
            );
          })}

          {/* North indicator */}
          <g transform="translate(20, 50)">
            <circle cx="0" cy="0" r="12" fill="white" opacity="0.7" />
            <line x1="0" y1="10" x2="0" y2="-4" stroke="#6b2737" strokeWidth="1.5" />
            <polygon points="0,-9 -3.5,1 3.5,1" fill="#6b2737" />
            <text x="0" y="22" fontSize="8" fill="#6b2737" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="bold">N</text>
          </g>

          {/* Legend */}
          <g transform="translate(278, 592)">
            <rect x="0" y="-4" width="152" height="64" rx="6" fill="white" opacity="0.88" stroke="#d4c5a9" strokeWidth="0.8" />
            <circle cx="12" cy="10" r="5.5" fill="#2c3e50" stroke="white" strokeWidth="1.5" />
            <text x="21" y="14" fontSize="7.5" fill="#4a3c30" fontFamily="Georgia, serif">Hotel Yountville</text>
            <circle cx="12" cy="26" r="5.5" fill="#6b2737" stroke="white" strokeWidth="1.5" />
            <text x="21" y="30" fontSize="7.5" fill="#4a3c30" fontFamily="Georgia, serif">Winery</text>
            <line x1="5" y1="42" x2="22" y2="42" stroke="#c9a84c" strokeWidth="2" />
            <text x="26" y="46" fontSize="7.5" fill="#4a3c30" fontFamily="Georgia, serif">Hwy 29</text>
            <line x1="5" y1="56" x2="22" y2="56" stroke="#c9a84c" strokeWidth="1.8" strokeDasharray="4,3" />
            <text x="26" y="60" fontSize="7.5" fill="#4a3c30" fontFamily="Georgia, serif">Silverado Trail</text>
          </g>
        </svg>
      </div>

      {/* Stop list */}
      <div style={{ maxWidth: "420px", margin: "1.5rem auto 0", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {wineryStops.map((stop, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
              background: "white",
              borderRadius: "0.5rem",
              border: "1px solid #e5ddd0",
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "#6b2737", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: "bold", flexShrink: 0,
                fontFamily: "Georgia, serif",
              }}
            >
              {i + 1}
            </div>
            <span style={{ fontSize: "0.9rem", color: "#3a3028", fontFamily: "Georgia, serif" }}>{stop.name}</span>
            {stop.confirmed && (
              <span style={{
                fontSize: "0.65rem", background: "#f0faf4", color: "#2d7a4a",
                border: "1px solid #a8dbb8", borderRadius: "1rem",
                padding: "0.15rem 0.5rem", marginLeft: "auto", whiteSpace: "nowrap",
              }}>
                ✓ Confirmed
              </span>
            )}
          </div>
        ))}
      </div>

      <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#b0a090", marginTop: "2rem" }}>
        <a href="/" style={{ color: "#6b2737", textDecoration: "none" }}>← Back to itinerary</a>
      </p>
    </div>
  );
}
