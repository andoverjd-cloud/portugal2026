import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

// One-time migration endpoint — DELETE after running
// POST /api/migrate { secret }
export async function POST(req: NextRequest) {
  const { secret } = await req.json();
  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    CREATE TABLE IF NOT EXISTS trips (
      trip_id      TEXT PRIMARY KEY,
      name         TEXT NOT NULL,
      url          TEXT NOT NULL,
      start_date   DATE NOT NULL,
      end_date     DATE NOT NULL,
      archived     BOOLEAN NOT NULL DEFAULT false,
      archived_at  TIMESTAMPTZ,
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS trip_days (
      trip_id   TEXT NOT NULL REFERENCES trips(trip_id) ON DELETE CASCADE,
      day_id    TEXT NOT NULL,
      label     TEXT NOT NULL,
      date      DATE NOT NULL,
      subtitle  TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      PRIMARY KEY (trip_id, day_id)
    )
  `;

  // Seed trips
  const trips = [
    { trip_id: "bermuda2025", name: "Bermuda 2025", url: "https://bermuda2025.thedrakes.info/memories", start_date: "2025-04-24", end_date: "2025-04-28" },
    { trip_id: "bermuda2026", name: "Bermuda 2026", url: "https://bermuda2026.thedrakes.info/memories", start_date: "2026-04-21", end_date: "2026-04-26" },
    { trip_id: "napa2025",    name: "Napa 2025",    url: "https://napa2025.thedrakes.info/memories",    start_date: "2025-11-05", end_date: "2025-11-09" },
    { trip_id: "portugal2026",name: "Portugal 2026",url: "https://portugal2026.thedrakes.info/memories",start_date: "2026-10-18", end_date: "2026-10-26" },
    { trip_id: "napa2026",    name: "Napa 2026",    url: "https://napa2026.thedrakes.info/memories",    start_date: "2026-11-03", end_date: "2026-11-07" },
  ];

  for (const t of trips) {
    await sql`
      INSERT INTO trips (trip_id, name, url, start_date, end_date)
      VALUES (${t.trip_id}, ${t.name}, ${t.url}, ${t.start_date}, ${t.end_date})
      ON CONFLICT (trip_id) DO UPDATE SET
        name = EXCLUDED.name,
        url = EXCLUDED.url,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        updated_at = NOW()
    `;
  }

  // Seed portugal2026 days
  const days = [
    { day_id: "sunday",       label: "Sunday",  date: "2026-10-18", subtitle: "Arrival — Lisbon to the Douro Valley",          sort_order: 0 },
    { day_id: "monday",       label: "Monday",  date: "2026-10-19", subtitle: "Douro Valley — Explore, Tastings & Dinner",     sort_order: 1 },
    { day_id: "tuesday",      label: "Tuesday", date: "2026-10-20", subtitle: "Douro Valley — Kitchen Table, Wine & Cheeses",  sort_order: 2 },
    { day_id: "wednesday",    label: "Wednesday",date: "2026-10-21",subtitle: "Into the Alentejo — São Lourenço do Barrocal",  sort_order: 3 },
    { day_id: "thursday",     label: "Thursday",date: "2026-10-22", subtitle: "Alentejo — Olive Oil, Wine & Off-Property Dinner",sort_order: 4 },
    { day_id: "friday",       label: "Friday",  date: "2026-10-23", subtitle: "Alentejo — Malhadinha Nova",                    sort_order: 5 },
    { day_id: "saturday",     label: "Saturday",date: "2026-10-24", subtitle: "Malhadinha Nova — A Day on the Estate",         sort_order: 6 },
    { day_id: "sunday-lisbon",label: "Sunday",  date: "2026-10-25", subtitle: "Lisbon — The Ivens",                            sort_order: 7 },
    { day_id: "monday-lisbon",label: "Monday",  date: "2026-10-26", subtitle: "Lisbon — Last Day",                             sort_order: 8 },
  ];

  for (const d of days) {
    await sql`
      INSERT INTO trip_days (trip_id, day_id, label, date, subtitle, sort_order)
      VALUES ('portugal2026', ${d.day_id}, ${d.label}, ${d.date}, ${d.subtitle}, ${d.sort_order})
      ON CONFLICT (trip_id, day_id) DO UPDATE SET
        label = EXCLUDED.label,
        date = EXCLUDED.date,
        subtitle = EXCLUDED.subtitle,
        sort_order = EXCLUDED.sort_order
    `;
  }

  return NextResponse.json({ ok: true, message: "Migration complete — delete this endpoint" });
}
