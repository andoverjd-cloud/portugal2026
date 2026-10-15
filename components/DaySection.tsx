"use client";

import { useState } from "react";
import type { Day } from "@/lib/itinerary";
import StopCard from "./StopCard";
import DayMap from "./DayMap";

const dayNumbers: Record<string, string> = {
  sunday: "01",
  monday: "02",
  tuesday: "03",
  wednesday: "04",
  thursday: "05",
  friday: "06",
  saturday: "07",
  "monday-lisbon": "08",
};

export default function DaySection({ day }: { day: Day }) {
  const [mapOpen, setMapOpen] = useState(true);

  return (
    <section className="day-section py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-baseline gap-4 mb-8">
          <span className="text-5xl font-bold text-azure/15 font-serif leading-none select-none">
            {dayNumbers[day.id]}
          </span>
          <div>
            <p className="text-xs uppercase tracking-widest text-azure/60 font-medium mb-0.5">
              {day.date}
            </p>
            <h2 className="text-2xl font-semibold text-slate font-serif">{day.label}</h2>
            {day.subtitle && (
              <p className="text-lg text-terra font-serif italic mt-1">{day.subtitle}</p>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate/5">
          {day.stops.map((stop, i) => (
            <StopCard key={i} stop={stop} />
          ))}
        </div>

        <button
          onClick={() => setMapOpen((v) => !v)}
          className="mt-8 mb-4 flex items-center gap-2 text-sm font-medium text-azure hover:text-azure-light transition-colors"
        >
          <span className="text-base">{mapOpen ? "▲" : "▼"}</span>
          {mapOpen ? "Hide map" : "Show day map"}
        </button>

        {mapOpen && (
          <DayMap dayId={day.id} regions={day.regions} />
        )}
      </div>
    </section>
  );
}
