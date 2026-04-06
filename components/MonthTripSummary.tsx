"use client";

import { useState } from "react";
import type { Trip, Visit } from "@/lib/types";
import { TRIP_COLORS } from "@/lib/constants";

interface MonthTripSummaryProps {
  trips: Trip[];
  visits: Visit[];
  defaultExpanded: boolean;
  onTripClick: (tripId: string) => void;
  onVisitClick: (visitId: string) => void;
}

const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function MonthTripSummary({
  trips,
  visits,
  defaultExpanded,
  onTripClick,
  onVisitClick,
}: MonthTripSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const total = trips.length + visits.length;

  if (total === 0) return null;

  return (
    <div className="mt-1.5 mb-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer bg-transparent border-none p-0"
      >
        <span className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          ›
        </span>
        This month ({total})
      </button>
      {expanded && (
        <div className="mt-1 flex flex-col gap-1">
          {trips.map((trip) => {
            const c = TRIP_COLORS[trip.color % TRIP_COLORS.length];
            return (
              <div
                key={trip.id}
                onClick={() => onTripClick(trip.id)}
                className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: c }}
                />
                <span className="text-[11px] font-bold" style={{ color: c }}>
                  📍 {trip.destination}
                </span>
                <span className="text-[10px] text-gray-400">
                  {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
                </span>
              </div>
            );
          })}
          {visits.map((visit) => {
            const c = TRIP_COLORS[visit.color % TRIP_COLORS.length];
            return (
              <div
                key={visit.id}
                onClick={() => onVisitClick(visit.id)}
                className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: c }}
                />
                <span className="text-[11px] font-bold" style={{ color: c }}>
                  👋 {visit.visitorName}
                </span>
                <span className="text-[10px] text-gray-400">
                  {fmtDate(visit.startDate)} – {fmtDate(visit.endDate)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
