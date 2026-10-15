import type { Region } from "@/lib/itinerary";

interface DayMapProps {
  dayId: string;
  center: { lat: number; lng: number };
  zoom: number;
  regions: Region[];
}

export default function DayMap({ center, zoom, regions }: DayMapProps) {
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${center.lng - 0.5},${center.lat - 0.3},${center.lng + 0.5},${center.lat + 0.3}&layer=mapnik`;

  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl overflow-hidden shadow-sm border border-slate/10" style={{ height: "320px" }}>
        <iframe
          src={src}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          title="Day map"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {regions.map((r, i) => (
          <div
            key={i}
            className="flex items-start gap-2 text-xs bg-white/60 rounded-lg px-3 py-2 border border-slate/10 max-w-xs"
          >
            <span
              className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: r.color }}
            />
            <div>
              <div className="font-semibold text-slate">{r.name}</div>
              <div className="text-slate/60 leading-snug">{r.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
