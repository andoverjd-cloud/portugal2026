import { days } from "@/lib/itinerary";
import { NextResponse } from "next/server";

// GET /api/itinerary/days
// Returns the trip's day list — consumed by the travel hub so lib/itinerary.ts
// is the single source of truth for day IDs and dates.
export async function GET() {
  return NextResponse.json({
    days: days.map((d) => ({
      id: d.id,
      label: d.label,
      date: d.date,
      subtitle: d.subtitle ?? null,
    })),
  });
}
