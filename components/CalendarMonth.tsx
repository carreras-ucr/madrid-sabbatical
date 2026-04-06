"use client";

import { WEEKDAYS, TRIP_COLORS } from "@/lib/constants";
import { SCHOOL_EVENTS } from "@/lib/schoolEvents";
import type { Trip } from "@/lib/types";
import {
  computeWeekRows,
  computeTripSegments,
  getTripsForMonth,
} from "@/lib/tripLayout";
import TripLaneRow from "./TripLaneRow";
import MonthTripSummary from "./MonthTripSummary";

interface CalendarMonthProps {
  year: number;
  month: number;
  label: string;
  calendarMode: "all" | "trips";
  tripsByDate: Record<string, Trip[]>;
  trips: Trip[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  onTripClick: (tripId: string) => void;
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

export default function CalendarMonth({
  year,
  month,
  label,
  calendarMode,
  tripsByDate,
  trips,
  selectedDate,
  onSelectDate,
  onTripClick,
}: CalendarMonthProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekRows = computeWeekRows(year, month);
  const segmentsByRow = computeTripSegments(trips, year, month, weekRows);
  const monthTrips = getTripsForMonth(trips, year, month);

  const isWe = (d: number) => {
    const w = new Date(year, month, d).getDay();
    return w === 0 || w === 6;
  };

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

      {/* Week rows with trip lanes */}
      {weekRows.map((row, rowIdx) => {
        const segments = segmentsByRow[rowIdx];

        // Build cells for this week row: empty cells for padding + day cells
        const cells: React.ReactNode[] = [];

        // Add empty cells for padding at the start of the first row
        if (rowIdx === 0) {
          for (let i = 1; i < row.startCol; i++) {
            cells.push(<div key={`pad-${i}`} />);
          }
        }

        // Day cells
        for (const d of row.days) {
          const k = dk(year, month, d);
          const sch = SCHOOL_EVENTS[k];
          const dt = tripsByDate[k] || [];
          const we = isWe(d);
          const ty = sch?.type;

          // Background logic
          let bgClass = "bg-white";
          if (calendarMode === "all") {
            if (ty) bgClass = schoolBg(ty);
            else if (we) bgClass = "bg-gray-50";
          } else {
            // Trips-only mode
            if (we) bgClass = "bg-gray-50";
            // If day is part of a trip, add subtle tint via inline style below
          }

          // In trips-only mode, check if day is part of any trip for tinting
          const tripTint =
            calendarMode === "trips" && dt.length > 0
              ? TRIP_COLORS[dt[0].color % TRIP_COLORS.length] + "12"
              : undefined;

          cells.push(
            <div
              key={d}
              onClick={() => onSelectDate(selectedDate === k ? null : k)}
              className={`${tripTint ? "" : bgClass} rounded-md p-0.5 min-h-[38px] cursor-pointer text-[11px] overflow-hidden ${
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
            </div>
          );
        }

        // Add empty cells for padding at the end of the last row
        if (rowIdx === weekRows.length - 1) {
          const lastDay = row.days[row.days.length - 1];
          const lastCol =
            new Date(year, month, lastDay).getDay() === 0
              ? 7
              : new Date(year, month, lastDay).getDay();
          for (let i = lastCol + 1; i <= 7; i++) {
            cells.push(<div key={`pad-end-${i}`} />);
          }
        }

        return (
          <div key={rowIdx}>
            <div className="grid grid-cols-7 gap-0.5">{cells}</div>
            <TripLaneRow segments={segments} onTripClick={onTripClick} />
          </div>
        );
      })}

      {/* Monthly trip summary */}
      <MonthTripSummary
        trips={monthTrips}
        defaultExpanded={calendarMode === "trips"}
        onTripClick={onTripClick}
      />
    </div>
  );
}
