import type { Region } from "@/lib/itinerary";

interface DayMapProps {
  dayId: string;
  center: { lat: number; lng: number };
  zoom: number;
  regions: Region[];
}

export default function DayMap({ dayId, regions }: DayMapProps) {
  return (
    <div className="space-y-3">
      <div className="w-full rounded-xl overflow-hidden shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/maps/${dayId}.png`}
          alt="Day route map"
          width={1280}
          height={800}
          className="w-full h-auto"
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
