import { list, del } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";
import { MemoriesGrid } from "./MemoriesGrid";
import type { OrderItem, DayInfo } from "./MemoriesGrid";
import { days as itineraryDays } from "../../lib/itinerary";

const TRIP_ID = "portugal2026";

export const dynamic = "force-dynamic";

function getDb() {
  return neon(process.env.DATABASE_URL!);
}

async function saveOrder(items: OrderItem[]) {
  "use server";
  const sql = getDb();
  const secret = process.env.MEMORIES_ADMIN_SECRET!;
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://portugal2026.thedrakes.info";
  await fetch(`${base}/api/memories/metadata`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret,
      trip_id: TRIP_ID,
      items: items.map((item, idx) => ({
        pathname: item.pathname,
        day: item.day ?? null,
        caption: item.caption ?? null,
        sort_order: idx,
      })),
    }),
  });
}

async function deletePhoto(url: string, pathname: string, secret: string) {
  "use server";
  const { revalidatePath } = await import("next/cache");
  if (secret !== process.env.MEMORIES_ADMIN_SECRET) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  await del(url, { token });
  // Remove from DB
  const sql = getDb();
  await sql`DELETE FROM photo_metadata WHERE trip_id = ${TRIP_ID} AND pathname = ${pathname}`;
  revalidatePath("/memories");
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const params = await searchParams;
  const isAdmin = !!(
    process.env.MEMORIES_ADMIN_SECRET &&
    params.admin === process.env.MEMORIES_ADMIN_SECRET
  );

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  let blobs: { url: string; pathname: string; day?: string; caption?: string }[] = [];
  let listError: string | null = null;

  try {
    // Get all photos from Blob
    const result = await list({ prefix: `${TRIP_ID}/`, token });
    const photos = result.blobs.filter((b) => !b.pathname.endsWith("_order.json"));

    // Get metadata from Postgres (source of truth)
    const sql = getDb();
    const rows = await sql`
      SELECT pathname, day, caption, sort_order
      FROM photo_metadata
      WHERE trip_id = ${TRIP_ID}
      ORDER BY sort_order ASC NULLS LAST, created_at ASC
    `;

    const urlMap = new Map(photos.map((b) => [b.pathname, b.url]));

    if (rows.length > 0) {
      const metaMap = new Map(rows.map((r) => [r.pathname, r]));

      // Ordered photos (in DB order)
      const ordered = rows
        .filter((r) => urlMap.has(r.pathname))
        .map((r) => ({
          url: urlMap.get(r.pathname)!,
          pathname: r.pathname,
          ...(r.day ? { day: r.day } : {}),
          ...(r.caption ? { caption: r.caption } : {}),
        }));

      // New photos not yet in DB — append without day
      const dbPathnames = new Set(rows.map((r) => r.pathname));
      const newPhotos = photos
        .filter((b) => !dbPathnames.has(b.pathname))
        .map((b) => ({ url: b.url, pathname: b.pathname }));

      blobs = [...ordered, ...newPhotos];
    } else {
      // No DB entries yet — fall back to blob list order
      blobs = photos
        .sort((a, b) => a.pathname.localeCompare(b.pathname))
        .map((b) => ({ url: b.url, pathname: b.pathname }));
    }
  } catch (e) {
    listError = e instanceof Error ? e.message : String(e);
    console.error("Memories load error:", listError);
  }

  const days: DayInfo[] = itineraryDays.map((d) => ({
    id: d.id,
    label: d.label,
    date: d.date,
    subtitle: d.subtitle,
  }));

  return (
    <main className="min-h-screen" style={{ background: "var(--color-sand, #f5f0e8)" }}>
      <header
        className="py-12 px-4 text-center relative"
        style={{ background: "var(--color-ocean, #0077b6)" }}
      >
        <a href="/" className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: "rgba(255,255,255,0.6)" }}>
          ← Back
        </a>
        <p className="text-sm uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(224,212,180,0.85)" }}>
          Portugal · October 2026
        </p>
        <h1
          className="text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-serif, Georgia)", color: "#ffffff" }}
        >
          Memories
        </h1>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {listError && (
          <p className="text-center text-red-500 text-xs py-4">Error: {listError}</p>
        )}
        {blobs.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.5 }}>
            <p className="text-5xl mb-4">📸</p>
            <p className="text-lg font-medium">No memories yet</p>
            <p className="text-sm mt-2">Photos will appear here once added.</p>
          </div>
        ) : (
          <MemoriesGrid
            initialBlobs={blobs}
            isAdmin={isAdmin}
            adminSecret={params.admin ?? ""}
            days={days}
            saveOrder={saveOrder}
            deletePhoto={deletePhoto}
          />
        )}
      </div>

      <footer
        className="py-8 px-4 text-center text-sm"
        style={{ background: "var(--color-ocean-dark, #023e8a)", color: "rgba(255,255,255,0.4)" }}
      >
        <p>Portugal 2026 🇵🇹 · John · Lea · October 2026</p>
      </footer>
    </main>
  );
}
