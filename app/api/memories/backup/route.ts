import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// POST /api/memories/backup { secret, trip_id }
// Dumps full photo_metadata for the trip to a timestamped JSON file in Blob
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!trip_id) return NextResponse.json({ error: "missing trip_id" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT pathname, day, caption, sort_order, created_at, updated_at
    FROM photo_metadata
    WHERE trip_id = ${trip_id}
    ORDER BY sort_order ASC NULLS LAST, created_at ASC
  `;

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const pathname = `${trip_id}/_backups/${timestamp}.json`;
  const content = JSON.stringify({ trip_id, backed_up_at: new Date().toISOString(), count: rows.length, photos: rows }, null, 2);

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const result = await put(pathname, content, {
    access: "public",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });

  return NextResponse.json({ ok: true, count: rows.length, url: result.url, pathname });
}
