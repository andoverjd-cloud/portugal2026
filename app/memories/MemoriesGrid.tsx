"use client";

import { useState, useRef, useEffect } from "react";

type BlobItem = { url: string; pathname: string };

function Lightbox({ url, index, total, onClose, onPrev, onNext }: {
  url: string; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="object-contain"
        style={{ width: "auto", height: "auto", maxWidth: "85vw", maxHeight: "90vh", minWidth: "min(85vw, 600px)", minHeight: "min(70vh, 400px)" }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >
        ✕
      </button>
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          ‹
        </button>
      )}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >
          ›
        </button>
      )}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
        {index + 1} / {total}
      </p>
    </div>
  );
}

function AdminLock({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (isAdmin) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set("admin", value.trim());
      window.location.href = url.toString();
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <form onSubmit={submit} className="flex items-center gap-2 bg-white rounded-full shadow-lg px-3 py-2 border border-gray-200">
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Admin secret"
            className="text-sm outline-none w-36 bg-transparent"
          />
          <button type="submit" className="text-xs font-semibold" style={{ color: "var(--color-ocean, #0077b6)" }}>
            Go
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Admin"
        >
          🔒
        </button>
      )}
    </div>
  );
}

export function MemoriesGrid({
  initialBlobs,
  isAdmin,
  adminSecret,
  saveOrder,
  deletePhoto,
}: {
  initialBlobs: BlobItem[];
  isAdmin: boolean;
  adminSecret: string;
  saveOrder: (pathnames: string[]) => Promise<void>;
  deletePhoto: (url: string, pathname: string, secret: string) => Promise<void>;
}) {
  const [blobs, setBlobs] = useState(initialBlobs);
  const [saving, setSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  function onDragStart(i: number) {
    dragIndex.current = i;
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    dragOverIndex.current = i;
  }

  async function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const from = dragIndex.current;
    const to = dragOverIndex.current;
    if (from === null || to === null || from === to) return;

    const next = [...blobs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlobs(next);
    dragIndex.current = null;
    dragOverIndex.current = null;

    setSaving(true);
    try {
      await saveOrder(next.map((b) => b.pathname));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(url: string, pathname: string) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(url, pathname, adminSecret);
    setBlobs((prev) => prev.filter((b) => b.url !== url));
  }

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          url={blobs[lightboxIndex].url}
          index={lightboxIndex}
          total={blobs.length}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(blobs.length - 1, (i ?? 0) + 1))}
        />
      )}
      <AdminLock isAdmin={isAdmin} />
      {saving && (
        <p className="text-center text-xs mb-4" style={{ color: "var(--color-ocean, #0077b6)", opacity: 0.6 }}>
          Saving order…
        </p>
      )}
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        {blobs.map((blob, i) => (
          <div
            key={blob.url}
            className="relative group"
            draggable={isAdmin}
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={onDrop}
            style={isAdmin ? { cursor: "grab" } : undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={blob.url}
              alt=""
              className="w-full rounded-lg shadow-sm object-cover aspect-square"
              style={{ cursor: "pointer" }}
              loading="lazy"
              draggable={false}
              onClick={() => setLightboxIndex(i)}
            />
            {isAdmin && (
              <button
                onClick={() => handleDelete(blob.url, blob.pathname)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity"
                style={{ background: "rgba(180,30,30,0.85)" }}
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
