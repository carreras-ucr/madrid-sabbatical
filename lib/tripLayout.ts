import type { Trip } from "./types";
import { TRIP_COLORS } from "./constants";

export interface WeekRow {
  /** 1-based day numbers in this week row */
  days: number[];
  /** Grid column (1-7) for the first day in this row */
  startCol: number;
}

export interface TripSegment {
  tripId: string;
  destination: string;
  color: string;
  /** CSS grid-column start (1-7) */
  gridColumnStart: number;
  /** CSS grid-column end (2-8, exclusive) */
  gridColumnEnd: number;
  /** First segment of the trip (round left corners) */
  isStart: boolean;
  /** Last segment of the trip (round right corners) */
  isEnd: boolean;
  /** 0-based lane for vertical stacking */
  lane: number;
}

/**
 * Compute week rows for a given month.
 * Each row contains the days that fall in that calendar week (Mon-Sun).
 */
export function computeWeekRows(year: number, month: number): WeekRow[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const rows: WeekRow[] = [];
  let currentRow: WeekRow | null = null;

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay(); // 0=Sun, 1=Mon, ...
    const col = dow === 0 ? 7 : dow; // Convert to 1=Mon, 7=Sun

    if (col === 1 || !currentRow) {
      // Start new week row
      currentRow = { days: [], startCol: col };
      rows.push(currentRow);
    }

    currentRow.days.push(d);
  }

  return rows;
}

/**
 * Get the date key for a year/month/day.
 */
function dk(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Get all trips that overlap a given month.
 */
export function getTripsForMonth(
  trips: Trip[],
  year: number,
  month: number
): Trip[] {
  const monthStart = dk(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = dk(year, month, daysInMonth);

  return trips.filter(
    (t) => t.startDate <= monthEnd && t.endDate >= monthStart
  );
}

/**
 * Compute trip segments for a given month, assigning them to week rows.
 * Returns segments grouped by week row index.
 */
export function computeTripSegments(
  trips: Trip[],
  year: number,
  month: number,
  weekRows: WeekRow[]
): TripSegment[][] {
  const monthTrips = getTripsForMonth(trips, year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // For each week row, collect segments
  const segmentsByRow: TripSegment[][] = weekRows.map(() => []);

  for (const trip of monthTrips) {
    const color = TRIP_COLORS[trip.color % TRIP_COLORS.length];

    // Clip trip to this month
    const tripStartDay = trip.startDate < dk(year, month, 1) ? 1 : parseInt(trip.startDate.slice(8));
    const monthEndStr = dk(year, month, daysInMonth);
    const tripEndDay = trip.endDate > monthEndStr ? daysInMonth : parseInt(trip.endDate.slice(8));

    // Check if trip actually starts/ends in this month
    const tripStartsThisMonth = trip.startDate >= dk(year, month, 1) && trip.startDate <= monthEndStr;
    const tripEndsThisMonth = trip.endDate >= dk(year, month, 1) && trip.endDate <= monthEndStr;

    // Find which week rows this trip spans
    for (let rowIdx = 0; rowIdx < weekRows.length; rowIdx++) {
      const row = weekRows[rowIdx];
      const rowFirstDay = row.days[0];
      const rowLastDay = row.days[row.days.length - 1];

      // Does this trip overlap this week row?
      if (tripStartDay > rowLastDay || tripEndDay < rowFirstDay) continue;

      const segStart = Math.max(tripStartDay, rowFirstDay);
      const segEnd = Math.min(tripEndDay, rowLastDay);

      // Compute grid columns for the segment
      // Find the column for segStart and segEnd within this row
      const startIdx = row.days.indexOf(segStart);
      const endIdx = row.days.indexOf(segEnd);

      if (startIdx === -1 || endIdx === -1) continue;

      const gridColumnStart = row.startCol + startIdx;
      const gridColumnEnd = row.startCol + endIdx + 1; // exclusive

      const isStart = tripStartsThisMonth && segStart === tripStartDay;
      const isEnd = tripEndsThisMonth && segEnd === tripEndDay;

      segmentsByRow[rowIdx].push({
        tripId: trip.id,
        destination: trip.destination,
        color,
        gridColumnStart,
        gridColumnEnd,
        isStart,
        isEnd,
        lane: 0, // assigned later
      });
    }
  }

  // Assign lanes for each row
  for (const segments of segmentsByRow) {
    assignLanes(segments);
  }

  return segmentsByRow;
}

/**
 * Assign lane indices to segments so overlapping trips don't collide.
 * Simple greedy: sort by start column, assign lowest available lane.
 */
function assignLanes(segments: TripSegment[]): void {
  segments.sort((a, b) => a.gridColumnStart - b.gridColumnStart);

  // Track the end column of each lane
  const laneEnds: number[] = [];

  for (const seg of segments) {
    let assigned = false;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] <= seg.gridColumnStart) {
        seg.lane = lane;
        laneEnds[lane] = seg.gridColumnEnd;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      seg.lane = laneEnds.length;
      laneEnds.push(seg.gridColumnEnd);
    }
  }
}
