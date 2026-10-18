import { list, put } from "@vercel/blob";
import { MemoriesGrid } from "./MemoriesGrid";

const TRIP_ID = "portugal2026";
const ORDER_KEY = `${TRIP_ID}/_order.json`;

export const dynamic = "force-dynamic";

async function saveOrder(pathnames: string[]) {
  "use server";
  await put(ORDER_KEY, JSON.stringify(pathnames), {
    access: "public",
    token: process.env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

async function deletePhoto(url: string, pathname: string, secret: string) {
  "use server";
  const { del, list: listBlobs, put: putBlob } = await import("@vercel/blob");
  const { revalidatePath } = await import("next/cache");
  if (secret !== process.env.MEMORIES_ADMIN_SECRET) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  await del(url, { token });
  try {
    const result = await listBlobs({ prefix: `${TRIP_ID}/`, token });
    const orderBlob = result.blobs.find((b) => b.pathname === ORDER_KEY);
    if (orderBlob) {
      const res = await fetch(orderBlob.url);
      const order: string[] = await res.json();
      await putBlob(ORDER_KEY, JSON.stringify(order.filter((p) => p !== pathname)), {
        access: "public", token, addRandomSuffix: false, allowOverwrite: true,
      });
    }
  } catch { /* order cleanup is best-effort */ }
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
  let blobs: { url: string; pathname: string }[] = [];
  let listError: string | null = null;
  let savedOrder: string[] | null = null;

  try {
    const result = await list({ prefix: `${TRIP_ID}/`, token });
    const photos = result.blobs.filter((b) => !b.pathname.endsWith("_order.json"));

    const orderBlob = result.blobs.find((b) => b.pathname === ORDER_KEY);
    if (orderBlob) {
      try {
        const res = await fetch(orderBlob.url);
        savedOrder = await res.json();
      } catch {
        // fall back to pathname sort
      }
    }

    if (savedOrder) {
      const map = new Map(photos.map((b) => [b.pathname, b]));
      const ordered = savedOrder.flatMap((p) => (map.has(p) ? [map.get(p)!] : []));
      const newPhotos = photos.filter((b) => !savedOrder!.includes(b.pathname));
      blobs = [...ordered, ...newPhotos];
    } else {
      blobs = photos.sort((a, b) => a.pathname.localeCompare(b.pathname));
    }
  } catch (e) {
    listError = e instanceof Error ? e.message : String(e);
    console.error("Blob list error:", listError);
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--color-sand, #f5f0e8)" }}>
      <header
        className="py-12 px-4 text-center relative"
        style={{ background: "var(--color-azure, #1a3a5c)" }}
      >
        <a href="/" className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: "rgba(245,240,232,0.6)" }}>
          ← Back
        </a>
        <p className="text-sm uppercase tracking-[0.3em] mb-3" style={{ color: "rgba(196,98,45,0.9)" }}>
          Portugal · October 2026
        </p>
        <h1
          className="text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-serif, Georgia)", color: "#f5f0e8" }}
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
            saveOrder={saveOrder}
            deletePhoto={deletePhoto}
          />
        )}
      </div>

      <footer
        className="py-8 px-4 text-center text-sm"
        style={{ background: "var(--color-azure-dark, #0e2340)", color: "rgba(245,240,232,0.4)" }}
      >
        <p>Feliz aniversário 🇵🇹 · John · Lea · October 2026</p>
      </footer>
    </main>
  );
}
