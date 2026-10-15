import { list } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";

const TRIP_ID = "portugal2026";

export const dynamic = "force-dynamic";

async function deletePhoto(formData: FormData) {
  "use server";
  const url = formData.get("url") as string;
  const secret = formData.get("secret") as string;
  if (secret !== process.env.MEMORIES_ADMIN_SECRET) return;
  await del(url);
  revalidatePath("/memories");
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ admin?: string }>;
}) {
  const params = await searchParams;
  const isAdmin =
    process.env.MEMORIES_ADMIN_SECRET &&
    params.admin === process.env.MEMORIES_ADMIN_SECRET;

  let blobs: Awaited<ReturnType<typeof list>>["blobs"] = [];
  try {
    const result = await list({ prefix: `${TRIP_ID}/`, token: process.env.BLOB_READ_WRITE_TOKEN });
    blobs = result.blobs.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  } catch {
    // BLOB_READ_WRITE_TOKEN not yet configured
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
        <p className="text-xs uppercase tracking-[0.3em] mb-2" style={{ color: "rgba(196,98,45,0.9)" }}>
          Portugal · October 2026
        </p>
        <h1
          className="text-4xl font-bold mb-2"
          style={{ fontFamily: "var(--font-serif, Georgia)", color: "#f5f0e8" }}
        >
          Memories
        </h1>
        <p className="text-sm" style={{ color: "rgba(245,240,232,0.6)" }}>
          Send photos to{" "}
          <a href="mailto:draketrips@gmail.com" className="underline hover:opacity-80">
            draketrips@gmail.com
          </a>
        </p>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {blobs.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.5 }}>
            <p className="text-5xl mb-4">📸</p>
            <p className="text-lg font-medium">No memories yet</p>
            <p className="text-sm mt-2">
              Email photos to{" "}
              <a href="mailto:draketrips@gmail.com" className="underline">
                draketrips@gmail.com
              </a>{" "}
              and they&apos;ll appear here automatically.
            </p>
          </div>
        ) : (
          <div className="columns-2 md:columns-3 gap-3 space-y-3">
            {blobs.map((blob) => (
              <div key={blob.url} className="relative break-inside-avoid group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blob.url}
                  alt=""
                  className="w-full rounded-lg shadow-sm"
                  loading="lazy"
                />
                <div className="absolute bottom-0 left-0 right-0 rounded-b-lg px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.85)" }}>
                  {new Date(blob.uploadedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </div>
                {isAdmin && (
                  <form action={deletePhoto} className="absolute top-2 right-2">
                    <input type="hidden" name="url" value={blob.url} />
                    <input type="hidden" name="secret" value={params.admin} />
                    <button
                      type="submit"
                      className="w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center shadow opacity-80 hover:opacity-100 transition-opacity"
                      style={{ background: "rgba(180,30,30,0.85)" }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
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
