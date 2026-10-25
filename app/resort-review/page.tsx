"use client";
import { useEffect, useRef } from "react";

const CATS = [
  { n: "Dinner", w: 22 },
  { n: "Setting", w: 20 },
  { n: "Hospitality", w: 18 },
  { n: "Breakfast", w: 15 },
  { n: "Rooms", w: 14 },
  { n: "Activities", w: 11 },
];

const RESORTS = [
  {
    name: "Six Senses Douro Valley",
    place: "Douro Valley",
    overall: 4.20,
    scores: [4.0, 3.7, 4.3, 4.7, 4.0, 5.0],
    tag: "Best hospitality, breakfast, and activities.",
    color: "#2c5a8c",
  },
  {
    name: "São Lourenço do Barrocal",
    place: "Alentejo",
    overall: 4.36,
    scores: [4.0, 5.0, 3.7, 4.3, 4.7, 4.7],
    tag: "First overall: best rooms and a perfect setting.",
    color: "#a0721a",
  },
  {
    name: "Herdade da Malhadinha Nova",
    place: "Alentejo",
    overall: 4.07,
    scores: [4.7, 5.0, 3.0, 3.3, 4.0, 4.0],
    tag: "Best dinner and a perfect setting. Service lagged.",
    color: "#8a2a3d",
  },
];

const CX = 200, CY = 200, R0 = 36, R1 = 112, GAP = 1.2;
const K = (R1 - R0) / 5;

function pt(r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.sin(a), CY - r * Math.cos(a)];
}

function f(n: number) { return n.toFixed(2); }

function wedgePath(r: number, a1: number, a2: number) {
  const p1 = pt(r, a1), p2 = pt(r, a2), q2 = pt(R0, a2), q1 = pt(R0, a1);
  return `M${f(p1[0])} ${f(p1[1])} A${r} ${r} 0 0 1 ${f(p2[0])} ${f(p2[1])} L${f(q2[0])} ${f(q2[1])} A${R0} ${R0} 0 0 0 ${f(q1[0])} ${f(q1[1])} Z`;
}

function RoseChart({ resort }: { resort: typeof RESORTS[0] }) {
  let start = 0;
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label={`${resort.name} rose chart`} style={{ display: "block", width: "100%", height: "auto", overflow: "visible" }}>
      {[1, 2, 3, 4, 5].map((g) => (
        <circle key={g} fill="none" stroke="#cfd4d0" strokeWidth={1} strokeDasharray="2 4" cx={CX} cy={CY} r={R0 + K * g} />
      ))}
      {CATS.map((cat, i) => {
        const span = (cat.w / 100) * 360;
        const a1 = start + GAP / 2;
        const a2 = start + span - GAP / 2;
        const mid = start + span / 2;
        const r = R0 + K * resort.scores[i];
        const vp = pt(r - 11, mid);
        const lp = pt(R1 + 14, mid);
        const sx = Math.sin((mid * Math.PI) / 180);
        const anchor = sx > 0.25 ? "start" : sx < -0.25 ? "end" : "middle";
        start += span;
        return (
          <g key={cat.n}>
            <path d={wedgePath(r, a1, a2)} fill={resort.color} stroke="white" strokeWidth={2}
              style={{ transformBox: "view-box", transformOrigin: `${CX}px ${CY}px` }} />
            <text x={f(vp[0])} y={f(vp[1])} fill="white" fontSize={12.5}
              textAnchor="middle" dominantBaseline="central" fontFamily="system-ui, sans-serif" fontWeight={500}>
              {resort.scores[i].toFixed(1)}
            </text>
            <text x={f(lp[0])} y={f(lp[1])} fill="#17212b" fontSize={13.5}
              textAnchor={anchor} dominantBaseline="central" fontFamily="system-ui, sans-serif">
              {cat.n}
            </text>
          </g>
        );
      })}
      <circle fill="white" cx={CX} cy={CY} r={R0 - 2} />
      <text x={CX} y={CY} fill="#17212b" fontSize={17} textAnchor="middle" dominantBaseline="central"
        fontFamily="var(--font-serif), Georgia, serif" fontWeight={800}>
        {resort.overall.toFixed(2)}
      </text>
    </svg>
  );
}

export default function ResortReview() {
  return (
    <main className="min-h-screen" style={{ background: "#f1f2ee" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "40px 20px 64px" }}>
        <a href="/" className="inline-flex items-center gap-1 text-sm mb-8 hover:opacity-80 transition-opacity" style={{ color: "#55616d" }}>
          ← Back
        </a>
        <h1 className="font-bold" style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(34px, 7vw, 60px)", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "14ch", margin: 0 }}>
          Three stays across Portugal
        </h1>
        <p style={{ maxWidth: "54ch", color: "#55616d", marginTop: 14, fontSize: 17 }}>
          October 18–26, 2026. We scored each resort on six things, and weighted them by how much they mattered to us.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, marginTop: 36 }}>
          {RESORTS.map((resort) => (
            <article key={resort.name} style={{ borderTop: `5px solid ${resort.color}`, paddingTop: 14 }}>
              <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
                {resort.name}
              </h2>
              <p style={{ color: "#55616d", fontSize: 14, margin: "2px 0 0" }}>{resort.place}</p>
              <RoseChart resort={resort} />
              <p style={{ display: "flex", alignItems: "baseline", gap: 8, margin: 0 }}>
                <b style={{ fontFamily: "var(--font-serif)", fontSize: 44, fontWeight: 800, lineHeight: 1, color: resort.color }}>
                  {resort.overall.toFixed(2)}
                </b>
                <span style={{ color: "#55616d", fontSize: 14 }}>out of 5</span>
              </p>
              <p style={{ marginTop: 6, fontSize: 15.5 }}>{resort.tag}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 36, paddingTop: 18, borderTop: "1px solid #cfd4d0", display: "grid", gap: 8, color: "#55616d", fontSize: 14.5, maxWidth: "62ch" }}>
          <p style={{ margin: 0 }}><strong style={{ color: "#17212b", fontWeight: 500 }}>Wedge width</strong> is how much a category counted toward the total: dinner the most, activities the least.</p>
          <p style={{ margin: 0 }}><strong style={{ color: "#17212b", fontWeight: 500 }}>Wedge reach</strong> is the score, from 1 at the inner ring to 5 at the outer edge. The number in the center is the weighted overall score.</p>
        </div>
      </div>
    </main>
  );
}
