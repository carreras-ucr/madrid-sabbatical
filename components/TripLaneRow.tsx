import type { TripSegment } from "@/lib/tripLayout";

interface TripLaneRowProps {
  segments: TripSegment[];
  onTripClick: (tripId: string) => void;
}

export default function TripLaneRow({ segments, onTripClick }: TripLaneRowProps) {
  if (segments.length === 0) return null;

  const maxLane = Math.max(...segments.map((s) => s.lane));

  return (
    <div
      className="grid grid-cols-7 gap-0.5"
      style={{
        gridTemplateRows: `repeat(${maxLane + 1}, auto)`,
      }}
    >
      {segments.map((seg, i) => {
        const roundLeft = seg.isStart ? "rounded-l-md" : "";
        const roundRight = seg.isEnd ? "rounded-r-md" : "";

        return (
          <div
            key={`${seg.tripId}-${i}`}
            className={`flex items-center px-1.5 h-5 cursor-pointer overflow-hidden ${roundLeft} ${roundRight} hover:opacity-80 transition-opacity`}
            style={{
              gridColumn: `${seg.gridColumnStart} / ${seg.gridColumnEnd}`,
              gridRow: seg.lane + 1,
              backgroundColor: seg.color + "30",
              borderLeft: seg.isStart ? `3px solid ${seg.color}` : undefined,
            }}
            onClick={() => onTripClick(seg.tripId)}
            title={seg.destination}
          >
            <span
              className="text-[10px] font-bold truncate leading-tight"
              style={{ color: seg.color }}
            >
              {seg.destination}
            </span>
          </div>
        );
      })}
    </div>
  );
}
