import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

// GET /api/memories/status?trip=portugal2026
// Unauthenticated — used by upload script and bot before uploading
export async function GET(req: NextRequest) {
  const trip_id = req.nextUrl.searchParams.get("trip");
  if (!trip_id) return NextResponse.json({ error: "missing trip" }, { status: 400 });

  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`
    SELECT archived, archived_at FROM trips WHERE trip_id = ${trip_id}
  `;

  if (rows.length === 0) {
    // Unknown trip — allow uploads (trip not yet registered)
    return NextResponse.json({ trip_id, archived: false, known: false });
  }

  return NextResponse.json({
    trip_id,
    archived: rows[0].archived,
    archived_at: rows[0].archived_at ?? null,
    known: true,
  });
}
