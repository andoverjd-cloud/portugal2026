import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

const sql = neon(process.env.DATABASE_URL!);

// GET /api/memories/metadata?trip=portugal2026
export async function GET(req: NextRequest) {
  const trip = req.nextUrl.searchParams.get("trip");
  if (!trip) return NextResponse.json({ error: "missing trip" }, { status: 400 });

  const rows = await sql`
    SELECT pathname, day, caption, sort_order
    FROM photo_metadata
    WHERE trip_id = ${trip}
    ORDER BY sort_order ASC NULLS LAST, created_at ASC
  `;
  return NextResponse.json(rows);
}

// POST /api/memories/metadata
// Body: { secret, trip_id, items: [{pathname, day?, caption?, sort_order?}] }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id, items } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!trip_id || !Array.isArray(items)) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  for (const item of items) {
    await sql`
      INSERT INTO photo_metadata (trip_id, pathname, day, caption, sort_order, updated_at)
      VALUES (${trip_id}, ${item.pathname}, ${item.day ?? null}, ${item.caption ?? null}, ${item.sort_order ?? null}, NOW())
      ON CONFLICT (trip_id, pathname) DO UPDATE SET
        day = COALESCE(EXCLUDED.day, photo_metadata.day),
        caption = COALESCE(EXCLUDED.caption, photo_metadata.caption),
        sort_order = COALESCE(EXCLUDED.sort_order, photo_metadata.sort_order),
        updated_at = NOW()
    `;
  }

  return NextResponse.json({ ok: true, count: items.length });
}

// PATCH /api/memories/metadata
// Body: { secret, trip_id, pathname, day?, caption?, sort_order? }
// Updates a single photo's metadata fields (only provided fields)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id, pathname, day, caption, sort_order } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await sql`
    INSERT INTO photo_metadata (trip_id, pathname, day, caption, sort_order, updated_at)
    VALUES (${trip_id}, ${pathname}, ${day ?? null}, ${caption ?? null}, ${sort_order ?? null}, NOW())
    ON CONFLICT (trip_id, pathname) DO UPDATE SET
      day = CASE WHEN ${day !== undefined} THEN ${day ?? null} ELSE photo_metadata.day END,
      caption = CASE WHEN ${caption !== undefined} THEN ${caption ?? null} ELSE photo_metadata.caption END,
      sort_order = CASE WHEN ${sort_order !== undefined} THEN ${sort_order ?? null} ELSE photo_metadata.sort_order END,
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true });
}

// DELETE /api/memories/metadata
// Body: { secret, trip_id, pathname }
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id, pathname } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  await sql`DELETE FROM photo_metadata WHERE trip_id = ${trip_id} AND pathname = ${pathname}`;
  return NextResponse.json({ ok: true });
}
