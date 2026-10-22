import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

// POST /api/memories/archive { secret, trip_id, archived: bool }
// Archives (or unarchives) a trip. Archiving runs a full backup first.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { secret, trip_id, archived } = body;

  if (secret !== process.env.MEMORIES_ADMIN_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!trip_id || typeof archived !== "boolean") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const sql = neon(process.env.DATABASE_URL!);

  let backupUrl: string | null = null;

  if (archived) {
    // Run backup before archiving
    const rows = await sql`
      SELECT pathname, day, caption, sort_order, created_at, updated_at
      FROM photo_metadata
      WHERE trip_id = ${trip_id}
      ORDER BY sort_order ASC NULLS LAST, created_at ASC
    `;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const pathname = `${trip_id}/_backups/archive-${timestamp}.json`;
    const content = JSON.stringify({ trip_id, backed_up_at: new Date().toISOString(), type: "archive", count: rows.length, photos: rows }, null, 2);
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const result = await put(pathname, content, {
      access: "public",
      contentType: "application/json",
      token,
      addRandomSuffix: false,
    });
    backupUrl = result.url;
  }

  await sql`
    INSERT INTO trips (trip_id, name, url, start_date, end_date, archived, archived_at, updated_at)
    VALUES (
      ${trip_id},
      ${trip_id},
      '',
      NOW()::date,
      NOW()::date,
      ${archived},
      ${archived ? sql`NOW()` : null},
      NOW()
    )
    ON CONFLICT (trip_id) DO UPDATE SET
      archived = EXCLUDED.archived,
      archived_at = CASE WHEN ${archived} THEN NOW() ELSE NULL END,
      updated_at = NOW()
  `;

  return NextResponse.json({ ok: true, archived, backup_url: backupUrl });
}
