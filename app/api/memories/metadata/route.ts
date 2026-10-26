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
    // When no sort_order provided, place at end of that day (max + 1)
    let sortOrder = item.sort_order ?? null;
    if (sortOrder === null) {
      const dayVal = item.day ?? null;
      const rows = await sql`
        SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
        FROM photo_metadata
        WHERE trip_id = ${trip_id} AND day IS NOT DISTINCT FROM ${dayVal}
      `;
      sortOrder = rows[0]?.next_order ?? 0;
    }
    await sql`
      INSERT INTO photo_metadata (trip_id, pathname, day, caption, sort_order, updated_at)
      VALUES (${trip_id}, ${item.pathname}, ${item.day ?? null}, ${item.caption ?? null}, ${sortOrder}, NOW())
      ON CONFLICT (trip_id, pathname) DO UPDATE SET
        day = EXCLUDED.day,
        caption = EXCLUDED.caption,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()
    `;
  }

  return NextResponse.json({ ok: true, count: items.length });
}

// PATCH /api/memories/metadata
// Body: { secret, trip_id, pathname, day?, caption?, sort_order? }
// Updates only the fields present in the request body.
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id, pathname } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Only update fields that were explicitly sent — use sentinel string to distinguish
  // "not provided" from "provided as null/undefined", avoiding JS boolean → SQL coercion.
  const hasDay = Object.prototype.hasOwnProperty.call(body, "day");
  const hasCaption = Object.prototype.hasOwnProperty.call(body, "caption");
  const hasSortOrder = Object.prototype.hasOwnProperty.call(body, "sort_order");

  const day: string | null = hasDay ? (body.day ?? null) : null;
  const caption: string | null = hasCaption ? (body.caption ?? null) : null;
  const sortOrder: number | null = hasSortOrder ? (body.sort_order ?? null) : null;

  await sql`
    INSERT INTO photo_metadata (trip_id, pathname, day, caption, sort_order, updated_at)
    VALUES (${trip_id}, ${pathname}, ${day}, ${caption}, ${sortOrder}, NOW())
    ON CONFLICT (trip_id, pathname) DO UPDATE SET
      day        = CASE WHEN ${hasDay ? "set" : "keep"} = 'set'  THEN ${day}       ELSE photo_metadata.day END,
      caption    = CASE WHEN ${hasCaption ? "set" : "keep"} = 'set' THEN ${caption} ELSE photo_metadata.caption END,
      sort_order = CASE WHEN ${hasSortOrder ? "set" : "keep"} = 'set' THEN ${sortOrder} ELSE photo_metadata.sort_order END,
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
