"use client";

import { useState, useRef, useEffect } from "react";

export type OrderItem = { pathname: string; day?: string; caption?: string };
export type DayInfo = { id: string; label: string; date: string; subtitle?: string };
type BlobItem = { url: string; pathname: string; day?: string; caption?: string };

function Lightbox({ url, caption, index, total, onClose, onPrev, onNext }: {
  url: string; caption?: string; index: number; total: number;
  onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      e.stopImmediatePropagation();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={caption || ""}
        className="object-contain"
        style={{ width: "auto", height: "auto", maxWidth: "85vw", maxHeight: caption ? "82vh" : "90vh", minWidth: "min(85vw, 600px)", minHeight: "min(70vh, 400px)" }}
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-white text-lg font-bold"
        style={{ background: "rgba(255,255,255,0.15)" }}
      >✕</button>
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >‹</button>
      )}
      {index < total - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center text-white text-xl"
          style={{ background: "rgba(255,255,255,0.15)" }}
        >›</button>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
        {caption && (
          <p className="text-sm mb-1 px-4" style={{ color: "rgba(255,255,255,0.85)" }}>{caption}</p>
        )}
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{index + 1} / {total}</p>
      </div>
    </div>
  );
}

function AdminLock({ isAdmin, hidden }: { isAdmin: boolean; hidden?: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");

  if (hidden) return null;

  if (isAdmin) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            const url = new URL(window.location.href);
            url.searchParams.delete("admin");
            window.location.href = url.toString();
          }}
          className="w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Exit admin"
        >🔓</button>
      </div>
    );
  }

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
            autoFocus type="password" value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Admin secret"
            className="text-sm outline-none w-36 bg-transparent"
          />
          <button type="submit" className="text-xs font-semibold" style={{ color: "var(--color-ocean, #0077b6)" }}>Go</button>
          <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">✕</button>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Admin"
        >🔒</button>
      )}
    </div>
  );
}

function formatDate(dateStr: string) {
  return dateStr.replace(/,\s*\d{4}$/, "");
}

export function MemoriesGrid({
  initialBlobs,
  isAdmin,
  adminSecret,
  days,
  saveOrder,
  deletePhoto,
}: {
  initialBlobs: BlobItem[];
  isAdmin: boolean;
  adminSecret: string;
  days: DayInfo[];
  saveOrder: (items: OrderItem[]) => Promise<void>;
  deletePhoto: (url: string, pathname: string, secret: string) => Promise<void>;
}) {
  const [blobs, setBlobs] = useState(initialBlobs);
  const [saving, setSaving] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drag state
  const dragSrc = useRef<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: string | null; before: string | null } | null>(null);

  const isSelecting = selected.size > 0;

  async function persist(next: BlobItem[]) {
    setSaving(true);
    try {
      await saveOrder(next.map(b => ({
        pathname: b.pathname,
        ...(b.day ? { day: b.day } : {}),
        ...(b.caption ? { caption: b.caption } : {}),
      })));
    } finally {
      setSaving(false);
    }
  }

  function toggleSelect(pathname: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(pathname)) next.delete(pathname);
      else next.add(pathname);
      return next;
    });
  }

  async function moveSelectedToDay(dayId: string | null) {
    const next = blobs.map(b =>
      selected.has(b.pathname) ? { ...b, day: dayId ?? undefined } : b
    );
    setBlobs(next);
    setSelected(new Set());
    await persist(next);
  }

  function handleDragStart(pathname: string) {
    dragSrc.current = pathname;
  }

  function handleDragOverPhoto(e: React.DragEvent, pathname: string, day: string | undefined) {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget({ day: day ?? null, before: pathname });
  }

  function handleDragOverSection(e: React.DragEvent, dayId: string | null) {
    e.preventDefault();
    setDropTarget(prev => (prev?.before ? prev : { day: dayId, before: null }));
  }

  async function handleDrop(e: React.DragEvent, targetDay: string | null) {
    e.preventDefault();
    e.stopPropagation();
    const src = dragSrc.current;
    if (!src) return;

    const target = dropTarget;
    dragSrc.current = null;
    setDropTarget(null);

    const srcItem = blobs.find(b => b.pathname === src);
    if (!srcItem) return;

    const updated = { ...srcItem, day: targetDay ?? undefined };
    const without = blobs.filter(b => b.pathname !== src);

    let next: BlobItem[];
    if (target?.before) {
      const idx = without.findIndex(b => b.pathname === target.before);
      next = idx >= 0
        ? [...without.slice(0, idx), updated, ...without.slice(idx)]
        : [...without, updated];
    } else {
      const lastIdx = without.reduce<number>((last, b, i) =>
        (b.day ?? null) === targetDay ? i : last, -1);
      next = lastIdx >= 0
        ? [...without.slice(0, lastIdx + 1), updated, ...without.slice(lastIdx + 1)]
        : [...without, updated];
    }

    setBlobs(next);
    await persist(next);
  }

  async function handleSaveCaption(pathname: string) {
    const next = blobs.map(b =>
      b.pathname === pathname ? { ...b, caption: captionDraft.trim() || undefined } : b
    );
    setBlobs(next);
    setEditingCaption(null);
    await persist(next);
  }

  async function handleDelete(url: string, pathname: string) {
    if (!confirm("Delete this photo?")) return;
    await deletePhoto(url, pathname, adminSecret);
    setBlobs(prev => prev.filter(b => b.url !== url));
  }

  // Build day groups and unassigned
  const validDayIds = new Set(days.map(d => d.id));
  const grouped = days.map(day => ({
    ...day,
    items: blobs.filter(b => b.day === day.id),
  }));
  const unassigned = blobs.filter(b => !b.day || !validDayIds.has(b.day));

  // Flat ordered list for lightbox
  const allBlobs = [...grouped.flatMap(g => g.items), ...unassigned];

  function renderGrid(items: BlobItem[], dayId: string | null) {
    const isDragTarget = dropTarget?.day === dayId && !dropTarget.before;
    return (
      <div
        className="grid gap-3 min-h-[60px] rounded-xl transition-colors"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          ...(isDragTarget && isAdmin ? { background: "rgba(0,119,182,0.06)", outline: "2px dashed rgba(0,119,182,0.3)", outlineOffset: "4px" } : {}),
        }}
        onDragOver={(e) => handleDragOverSection(e, dayId)}
        onDrop={(e) => handleDrop(e, dayId)}
      >
        {items.map(blob => {
          const flatIdx = allBlobs.findIndex(b => b.pathname === blob.pathname);
          const isDropBefore = dropTarget?.before === blob.pathname;
          const isDragging = dragSrc.current === blob.pathname;
          const isSelected = selected.has(blob.pathname);
          return (
            <div key={blob.pathname} className="relative flex flex-col">
              {isDropBefore && isAdmin && (
                <div
                  className="absolute -left-1.5 top-0 bottom-0 w-1 rounded-full z-10"
                  style={{ background: "var(--color-ocean, #0077b6)" }}
                />
              )}
              <div
                className="relative group"
                draggable={isAdmin && !isSelecting}
                onDragStart={() => handleDragStart(blob.pathname)}
                onDragOver={(e) => handleDragOverPhoto(e, blob.pathname, blob.day)}
                style={isAdmin && !isSelecting ? { cursor: "grab", opacity: isDragging ? 0.35 : 1, transition: "opacity 0.15s" } : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={blob.url}
                  alt={blob.caption || ""}
                  className="w-full rounded-lg shadow-sm object-cover aspect-square"
                  style={{
                    cursor: "pointer",
                    ...(isSelected ? { outline: "3px solid var(--color-ocean, #0077b6)", outlineOffset: "2px" } : {}),
                  }}
                  loading="lazy"
                  draggable={false}
                  onClick={() => {
                    if (isSelecting && isAdmin) { toggleSelect(blob.pathname); return; }
                    if (!isDragging) setLightboxIndex(flatIdx);
                  }}
                />
                {/* Selection checkbox in admin mode */}
                {isAdmin && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleSelect(blob.pathname); }}
                    className={`absolute bottom-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow transition-opacity ${isSelected || isSelecting ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                    style={{
                      background: isSelected ? "var(--color-ocean, #0077b6)" : "rgba(255,255,255,0.85)",
                      color: isSelected ? "white" : "rgba(0,0,0,0.4)",
                    }}
                    title={isSelected ? "Deselect" : "Select"}
                  >{isSelected ? "✓" : "○"}</button>
                )}
                {isAdmin && (
                  <>
                    <button
                      onClick={() => handleDelete(blob.url, blob.pathname)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full text-white text-sm font-bold flex items-center justify-center shadow opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity"
                      style={{ background: "rgba(180,30,30,0.85)" }}
                      title="Delete"
                    >✕</button>
                    <button
                      onClick={() => { setEditingCaption(blob.pathname); setCaptionDraft(blob.caption || ""); }}
                      className="absolute top-2 left-2 w-7 h-7 rounded-full text-white text-xs flex items-center justify-center shadow opacity-0 group-hover:opacity-80 hover:!opacity-100 transition-opacity"
                      style={{ background: "rgba(0,0,0,0.55)" }}
                      title="Edit caption"
                    >✏️</button>
                  </>
                )}
              </div>
              {editingCaption === blob.pathname ? (
                <div className="mt-1.5 px-0.5">
                  <textarea
                    autoFocus
                    value={captionDraft}
                    onChange={e => setCaptionDraft(e.target.value)}
                    className="w-full text-xs rounded-lg p-2 border border-gray-300 resize-none outline-none"
                    rows={2}
                    placeholder="Caption…"
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveCaption(blob.pathname); }
                      if (e.key === "Escape") setEditingCaption(null);
                    }}
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button
                      onClick={() => handleSaveCaption(blob.pathname)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium"
                      style={{ background: "var(--color-ocean, #0077b6)", color: "white" }}
                    >Save</button>
                    <button onClick={() => setEditingCaption(null)} className="text-xs px-2.5 py-1 rounded-full text-gray-500 bg-gray-100">Cancel</button>
                  </div>
                </div>
              ) : blob.caption ? (
                <p
                  className="text-xs mt-1.5 text-center px-1 leading-snug"
                  style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.65 }}
                >{blob.caption}</p>
              ) : null}
            </div>
          );
        })}
        {items.length === 0 && isAdmin && (
          <div
            className="col-span-full rounded-xl border-2 border-dashed py-8 text-center text-xs"
            style={{ borderColor: isDragTarget ? "var(--color-ocean, #0077b6)" : "rgba(0,0,0,0.1)", color: isDragTarget ? "var(--color-ocean, #0077b6)" : "rgba(0,0,0,0.3)" }}
          >
            {isDragTarget ? "Drop here" : "No photos yet — drag to add"}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {lightboxIndex !== null && (
        <Lightbox
          url={allBlobs[lightboxIndex].url}
          caption={allBlobs[lightboxIndex].caption}
          index={lightboxIndex}
          total={allBlobs.length}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(i => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex(i => Math.min(allBlobs.length - 1, (i ?? 0) + 1))}
        />
      )}
      <AdminLock isAdmin={isAdmin} hidden={lightboxIndex !== null} />

      {/* Multi-select action bar */}
      {isSelecting && isAdmin && (
        <div
          className="sticky top-0 z-40 mb-6 rounded-2xl px-4 py-3 flex flex-wrap items-center gap-2 shadow-lg"
          style={{ background: "var(--color-ocean, #0077b6)" }}
        >
          <span className="text-white text-sm font-medium mr-1">{selected.size} selected — Move to:</span>
          {days.map(d => (
            <button
              key={d.id}
              onClick={() => moveSelectedToDay(d.id)}
              className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
            >{d.label}</button>
          ))}
          <button
            onClick={() => moveSelectedToDay(null)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >Unassign</button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs px-3 py-1.5 rounded-full font-medium"
            style={{ background: "rgba(0,0,0,0.2)", color: "white" }}
          >Cancel</button>
        </div>
      )}

      {saving && (
        <p className="text-center text-xs mb-4" style={{ color: "var(--color-ocean, #0077b6)", opacity: 0.6 }}>Saving…</p>
      )}

      {/* Day sections */}
      {grouped.filter(group => group.items.length > 0 || isAdmin).map(group => (
        <div key={group.id} className="mb-12">
          <div className="mb-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(0,119,182,0.15)" }}>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--color-ocean, #0077b6)" }}>
                {group.label} · {formatDate(group.date)}
              </h2>
              {group.subtitle && (
                <p className="text-sm mt-0.5" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.55 }}>
                  {group.subtitle}
                </p>
              )}
            </div>
            {/* Select all in this day */}
            {isAdmin && group.items.length > 0 && (
              <button
                onClick={() => {
                  const allInDay = group.items.map(b => b.pathname);
                  const allSelected = allInDay.every(p => selected.has(p));
                  setSelected(prev => {
                    const next = new Set(prev);
                    if (allSelected) allInDay.forEach(p => next.delete(p));
                    else allInDay.forEach(p => next.add(p));
                    return next;
                  });
                }}
                className="text-xs px-2.5 py-1 rounded-full transition-colors"
                style={{ background: "rgba(0,119,182,0.08)", color: "var(--color-ocean, #0077b6)" }}
              >
                {group.items.every(b => selected.has(b.pathname)) ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
          {group.items.length === 0 && !isAdmin ? (
            <p className="text-sm italic py-4" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.35 }}>
              No photos yet
            </p>
          ) : (
            renderGrid(group.items, group.id)
          )}
        </div>
      ))}

      {/* Unassigned */}
      {(unassigned.length > 0) && (
        <div className="mb-10">
          <div className="mb-4 pb-3 border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <h2 className="text-xl font-bold" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.4 }}>
              Unassigned
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--color-slate, #2c3e50)", opacity: 0.35 }}>
              Drag photos to a day above
            </p>
          </div>
          {renderGrid(unassigned, null)}
        </div>
      )}
    </>
  );
}
