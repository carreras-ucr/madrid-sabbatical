"use client";

import { useState } from "react";
import type { Trip, Visit } from "@/lib/types";
import { TRIP_COLORS } from "@/lib/constants";
import { getStopsForMonth } from "@/lib/tripLayout";

interface MonthTripSummaryProps {
  trips: Trip[];
  visits: Visit[];
  year: number;
  month: number;
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
  year,
  month,
  defaultExpanded,
  onTripClick,
  onVisitClick,
}: MonthTripSummaryProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Build display rows: for multi-destination trips, expand to one row per stop in month
  type TripRow = { trip: Trip; label: string; startDate: string; endDate: string };

  const rows: TripRow[] = [];
  for (const trip of trips) {
    const stops = getStopsForMonth(trip, year, month);
    if (trip.tripType === "multi" && stops.length > 0) {
      for (const stop of stops) {
        rows.push({
          trip,
          label: stop.city,
          startDate: stop.startDate,
          endDate: stop.endDate,
        });
      }
    } else {
      rows.push({
        trip,
        label: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
      });
    }
  }

  const total = rows.length + visits.length;
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
          {rows.map((row, i) => {
            const c = TRIP_COLORS[row.trip.color % TRIP_COLORS.length];
            return (
              <div
                key={`${row.trip.id}-${i}`}
                onClick={() => onTripClick(row.trip.id)}
                className="flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: c }}
                />
                <span className="text-[11px] font-bold" style={{ color: c }}>
                  📍 {row.label}
                </span>
                <span className="text-[10px] text-gray-400">
                  {fmtDate(row.startDate)} – {fmtDate(row.endDate)}
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
