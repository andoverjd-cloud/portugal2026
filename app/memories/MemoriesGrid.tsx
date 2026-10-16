"use client";

import { useState, useRef } from "react";

type BlobItem = { url: string; pathname: string };

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
  deletePhoto: (url: string, secret: string) => Promise<void>;
}) {
  const [blobs, setBlobs] = useState(initialBlobs);
  const [saving, setSaving] = useState(false);
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

  async function handleDelete(url: string) {
    await deletePhoto(url, adminSecret);
    setBlobs((prev) => prev.filter((b) => b.url !== url));
  }

  return (
    <>
      {saving && (
        <p className="text-center text-xs mb-4" style={{ color: "var(--color-azure, #1a3a5c)", opacity: 0.6 }}>
          Saving order…
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              loading="lazy"
              draggable={false}
            />
            {isAdmin && (
              <button
                onClick={() => handleDelete(blob.url)}
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
