"use client";

import { WEEKDAYS, TRIP_COLORS } from "@/lib/constants";
import { SCHOOL_EVENTS } from "@/lib/schoolEvents";
import type { Trip, Visit } from "@/lib/types";
import { getTripsForMonth } from "@/lib/tripLayout";
import MonthTripSummary from "./MonthTripSummary";

interface CalendarMonthProps {
  year: number;
  month: number;
  label: string;
  calendarMode: "all" | "trips";
  tripsByDate: Record<string, Trip[]>;
  trips: Trip[];
  visitsByDate: Record<string, Visit[]>;
  visits: Visit[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onTripClick: (tripId: string) => void;
  onVisitClick: (visitId: string) => void;
}

const dk = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

function schoolBg(type: string) {
  if (type === "vacation") return "bg-orange-50";
  if (type === "holiday") return "bg-red-50";
  if (type === "tentative") return "bg-yellow-50";
  if (type === "milestone") return "bg-green-50";
  return "";
}

function schoolTextColor(type: string) {
  if (type === "vacation") return "text-orange-700";
  if (type === "holiday") return "text-red-600";
  if (type === "tentative") return "text-yellow-700 italic";
  return "text-green-700";
}

function getVisitsForMonth(visits: Visit[], year: number, month: number): Visit[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthStart = dk(year, month, 1);
  const monthEnd = dk(year, month, daysInMonth);
  return visits.filter((v) => v.startDate <= monthEnd && v.endDate >= monthStart);
}

export default function CalendarMonth({
  year,
  month,
  label,
  calendarMode,
  tripsByDate,
  trips,
  visitsByDate,
  visits,
  selectedDate,
  onSelectDate,
  onTripClick,
  onVisitClick,
}: CalendarMonthProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthTrips = getTripsForMonth(trips, year, month);
  const monthVisits = getVisitsForMonth(visits, year, month);

  const getStartDay = () => {
    const d = new Date(year, month, 1).getDay();
    return d === 0 ? 6 : d - 1;
  };

  const isWe = (d: number) => {
    const w = new Date(year, month, d).getDay();
    return w === 0 || w === 6;
  };

  const start = getStartDay();
  const cells: React.ReactNode[] = [];

  // Padding cells
  for (let i = 0; i < start; i++) {
    cells.push(<div key={`pad-${i}`} />);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const k = dk(year, month, d);
    const sch = SCHOOL_EVENTS[k];
    const dt = tripsByDate[k] || [];
    const dv = visitsByDate[k] || [];
    const we = isWe(d);
    const ty = sch?.type;

    // Background logic
    let bgClass = "bg-white";
    if (calendarMode === "all") {
      if (ty) bgClass = schoolBg(ty);
      else if (we) bgClass = "bg-gray-50";
    } else {
      if (we) bgClass = "bg-gray-50";
    }

    // In trips-only mode, tint for trips or visits
    const tintSource = dt.length > 0 ? dt[0] : null;
    const visitTintSource = dv.length > 0 ? dv[0] : null;
    const tripTint =
      calendarMode === "trips" && (tintSource || visitTintSource)
        ? TRIP_COLORS[
            ((tintSource?.color ?? visitTintSource?.color ?? 0) % TRIP_COLORS.length)
          ] + "12"
        : undefined;

    cells.push(
      <div
        key={d}
        onClick={() => onSelectDate(selectedDate === k ? null : k)}
        className={`${tripTint ? "" : bgClass} rounded-md p-0.5 min-h-[50px] cursor-pointer text-[11px] overflow-hidden ${
          selectedDate === k
            ? "border-2 border-indigo-500"
            : "border border-gray-200"
        }`}
        style={tripTint ? { background: tripTint } : undefined}
      >
        <div
          className={`font-semibold text-xs ${
            we ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {d}
        </div>
        {/* School events only in "all" mode */}
        {calendarMode === "all" && sch && (
          <div
            className={`text-[9px] leading-[11px] font-medium truncate ${schoolTextColor(
              ty!
            )}`}
          >
            {sch.label}
          </div>
        )}
        {/* Badges in "all" mode */}
        {calendarMode === "all" && (dt.length > 0 || dv.length > 0) && (
          <div className="flex gap-0.5 mt-0.5 flex-wrap">
            {dt.slice(0, 2).map((t, i) => (
              <div
                key={`t${i}`}
                className="text-[8px] px-1 rounded truncate max-w-full font-bold"
                style={{
                  background: TRIP_COLORS[t.color % TRIP_COLORS.length] + "22",
                  color: TRIP_COLORS[t.color % TRIP_COLORS.length],
                }}
              >
                📍{t.destination.slice(0, 10)}
              </div>
            ))}
            {dv.slice(0, 2).map((v, i) => (
              <div
                key={`v${i}`}
                className="text-[8px] px-1 rounded truncate max-w-full font-bold"
                style={{
                  background: TRIP_COLORS[v.color % TRIP_COLORS.length] + "22",
                  color: TRIP_COLORS[v.color % TRIP_COLORS.length],
                }}
              >
                👋{v.visitorName.slice(0, 10)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h3 className="mb-1.5 text-[15px] font-bold text-slate-800">{label}</h3>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-semibold text-gray-400 py-0.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">{cells}</div>

      {/* Monthly summary */}
      <MonthTripSummary
        trips={monthTrips}
        visits={monthVisits}
        defaultExpanded={calendarMode === "trips"}
        onTripClick={onTripClick}
        onVisitClick={onVisitClick}
      />
    </div>
  );
}
