import type { Stop } from "@/lib/itinerary";
import clsx from "clsx";

const typeLabel: Record<Stop["type"], string> = {
  activity: "Activity",
  meal: "Dining",
  travel: "",
  hotel: "Hotel",
};

const typeStyle: Record<Stop["type"], string> = {
  activity: "bg-azure/10 text-azure border-azure/20",
  meal: "bg-terra/15 text-terra border-terra/30",
  travel: "",
  hotel: "bg-slate/10 text-slate border-slate/20",
};

export default function StopCard({ stop }: { stop: Stop }) {
  const isSubtle = stop.type === "travel";

  return (
    <div
      className={clsx(
        "flex gap-4 py-4",
        isSubtle && "opacity-60"
      )}
    >
      <div className="w-20 shrink-0 text-right">
        <span className="text-xs font-medium text-slate/50 leading-tight">
          {stop.time}
        </span>
      </div>

      <div className="relative flex flex-col items-center">
        <div
          className={clsx(
            "w-3 h-3 rounded-full mt-0.5 shrink-0 border-2",
            stop.type === "activity" && "bg-azure border-azure",
            stop.type === "meal" && "bg-terra border-terra",
            stop.type === "hotel" && "bg-slate border-slate",
            stop.type === "travel" && "bg-slate/30 border-slate/30"
          )}
        />
        <div className="w-px flex-1 bg-slate/10 mt-1" />
      </div>

      <div className="flex-1 pb-2">
        <div className="flex flex-wrap items-start gap-2 mb-1">
          {stop.url ? (
            <a
              href={stop.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-azure hover:text-azure-light transition-colors underline-offset-2 hover:underline font-serif"
            >
              {stop.name}
            </a>
          ) : (
            <span className="font-semibold text-slate font-serif">{stop.name}</span>
          )}
          {typeLabel[stop.type] && (
            <span
              className={clsx(
                "text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide",
                typeStyle[stop.type]
              )}
            >
              {typeLabel[stop.type]}
            </span>
          )}
          {stop.tags?.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide bg-terra/15 text-terra border-terra/30"
            >
              {tag}
            </span>
          ))}
          {stop.confirmed && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 uppercase tracking-wide">
              ✓ {stop.confirmed}
            </span>
          )}
        </div>
        <p className="text-sm text-slate/70 leading-relaxed">{stop.description}</p>
        {stop.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(stop.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate/40 hover:text-terra mt-1 inline-block transition-colors"
          >
            📍 {stop.address}
          </a>
        )}
      </div>
    </div>
  );
}
