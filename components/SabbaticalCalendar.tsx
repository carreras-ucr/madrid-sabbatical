"use client";

import { useState, useEffect, useCallback } from "react";
import { MONTHS, TRIP_COLORS, ITEM_ICONS, ITEM_LABELS } from "@/lib/constants";
import { SCHOOL_EVENTS } from "@/lib/schoolEvents";
import type { Trip, TripItem } from "@/lib/types";
import CalendarMonth from "./CalendarMonth";

const dk = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const fmtDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const gid = () => Math.random().toString(36).slice(2, 8);

type ItemType = "flight" | "train" | "hotel" | "other";

interface TripFormData {
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  color: number;
}

interface ItemFormData {
  type: ItemType;
  date: string;
  dateEnd: string;
  details: string;
  refNumber: string;
  direction: "outbound" | "return";
}

type ViewType = "calendar" | "trips" | "tripDetail";

export default function SabbaticalCalendar() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [view, setView] = useState<ViewType>("calendar");
  const [showTripForm, setShowTripForm] = useState(false);
  const [editTripId, setEditTripId] = useState<string | null>(null);
  const [tripForm, setTripForm] = useState<TripFormData>({
    destination: "",
    startDate: "",
    endDate: "",
    notes: "",
    color: 0,
  });
  const [detailTripId, setDetailTripId] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editItemId, setEditItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>({
    type: "flight",
    date: "",
    dateEnd: "",
    details: "",
    refNumber: "",
    direction: "outbound",
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [calendarMode, setCalendarMode] = useState<"all" | "trips">("all");

  // Load trips from API
  useEffect(() => {
    fetch("/api/trips")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setTrips(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Save trips to API after mutations
  const saveTrips = useCallback(
    (newTrips: Trip[]) => {
      setTrips(newTrips);
      fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrips),
      }).catch(() => {});
    },
    []
  );

  // Build trips-by-date index
  const tripsByDate: Record<string, Trip[]> = {};
  trips.forEach((trip) => {
    const c = new Date(trip.startDate + "T00:00:00");
    const e = new Date(trip.endDate + "T00:00:00");
    while (c <= e) {
      const k = c.toISOString().slice(0, 10);
      if (!tripsByDate[k]) tripsByDate[k] = [];
      tripsByDate[k].push(trip);
      c.setDate(c.getDate() + 1);
    }
  });

  const saveTrip = () => {
    if (!tripForm.destination || !tripForm.startDate || !tripForm.endDate) return;
    let newId: string;
    let newTrips: Trip[];
    if (editTripId) {
      newId = editTripId;
      newTrips = trips.map((t) =>
        t.id === editTripId ? { ...t, ...tripForm } : t
      );
    } else {
      newId = gid();
      newTrips = [...trips, { ...tripForm, id: newId, items: [] }];
    }
    saveTrips(newTrips);
    setShowTripForm(false);
    setEditTripId(null);
    setTripForm({
      destination: "",
      startDate: "",
      endDate: "",
      notes: "",
      color: newTrips.length % TRIP_COLORS.length,
    });
    setDetailTripId(newId);
    setView("tripDetail");
  };

  const deleteTrip = (id: string) => {
    const newTrips = trips.filter((t) => t.id !== id);
    saveTrips(newTrips);
    if (detailTripId === id) {
      setDetailTripId(null);
      setView("trips");
    }
    setConfirmDelete(null);
  };

  const openEditTrip = (trip: Trip) => {
    setTripForm({
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      notes: trip.notes || "",
      color: trip.color,
    });
    setEditTripId(trip.id);
    setShowTripForm(true);
  };

  const saveItem = () => {
    if (!itemForm.details && !itemForm.refNumber) return;
    const newTrips = trips.map((t) => {
      if (t.id !== detailTripId) return t;
      if (editItemId) {
        return {
          ...t,
          items: t.items.map((it) =>
            it.id === editItemId ? { ...it, ...itemForm } : it
          ),
        };
      }
      return { ...t, items: [...(t.items || []), { ...itemForm, id: gid() }] };
    });
    saveTrips(newTrips);
    setItemForm({
      type: "flight",
      date: "",
      dateEnd: "",
      details: "",
      refNumber: "",
      direction: "outbound",
    });
    setShowItemForm(false);
    setEditItemId(null);
  };

  const deleteItem = (tripId: string, itemId: string) => {
    const newTrips = trips.map((t) =>
      t.id !== tripId
        ? t
        : { ...t, items: t.items.filter((it) => it.id !== itemId) }
    );
    saveTrips(newTrips);
  };

  const openEditItem = (item: TripItem) => {
    setItemForm({
      type: item.type,
      date: item.date,
      dateEnd: item.dateEnd || "",
      details: item.details,
      refNumber: item.refNumber,
      direction: item.direction || "outbound",
    });
    setEditItemId(item.id);
    setShowItemForm(true);
  };

  const detailTrip = trips.find((t) => t.id === detailTripId);
  const sortedTrips = [...trips].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const schoolBg = (type: string) => {
    if (type === "vacation") return "bg-orange-50";
    if (type === "holiday") return "bg-red-50";
    if (type === "tentative") return "bg-yellow-50";
    if (type === "milestone") return "bg-green-50";
    return "";
  };

  const handleTripClick = (tripId: string) => {
    setDetailTripId(tripId);
    setView("tripDetail");
    setSelectedDate(null);
  };

  // Calendar view
  const renderCalendar = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MONTHS.map(({ year, month, label }) => (
          <CalendarMonth
            key={label}
            year={year}
            month={month}
            label={label}
            calendarMode={calendarMode}
            tripsByDate={tripsByDate}
            trips={trips}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onTripClick={handleTripClick}
          />
        ))}
      </div>

      {/* Bottom sheet for selected date */}
      {selectedDate && (() => {
        const sch = SCHOOL_EVENTS[selectedDate];
        const dt = tripsByDate[selectedDate] || [];
        const lbl = new Date(selectedDate + "T12:00:00").toLocaleDateString(
          "en-US",
          { weekday: "long", year: "numeric", month: "long", day: "numeric" }
        );
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.15)] rounded-t-2xl p-4 max-h-[45vh] overflow-y-auto z-[100]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-[15px] font-bold">{lbl}</h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="bg-slate-100 rounded-md px-2.5 py-1 cursor-pointer border-none"
              >
                ✕
              </button>
            </div>
            {sch && (
              <div
                className={`p-2 rounded-lg mb-1.5 text-xs border border-gray-200 ${schoolBg(
                  sch.type
                )}`}
              >
                <strong>School:</strong> {sch.label}
              </div>
            )}
            {dt.map((trip) => {
              const c = TRIP_COLORS[trip.color % TRIP_COLORS.length];
              return (
                <div
                  key={trip.id}
                  className="p-2 rounded-lg mb-1.5 cursor-pointer border"
                  style={{
                    background: c + "11",
                    borderColor: c + "33",
                  }}
                  onClick={() => handleTripClick(trip.id)}
                >
                  <strong style={{ color: c }}>
                    📍 {trip.destination}
                  </strong>
                  <span className="text-[11px] text-gray-500 ml-1.5">
                    {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
                  </span>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {(trip.items || []).length} details · Tap to view →
                  </div>
                </div>
              );
            })}
            {!sch && dt.length === 0 && (
              <p className="text-xs text-gray-400">No events this day.</p>
            )}
          </div>
        );
      })()}
    </>
  );

  // Trips list view
  const renderTripsList = () => (
    <div>
      {sortedTrips.length === 0 ? (
        <p className="text-center text-gray-400 py-10">
          No trips yet. Tap &quot;+ Add Trip&quot; to start planning!
        </p>
      ) : (
        sortedTrips.map((trip) => {
          const c = TRIP_COLORS[trip.color % TRIP_COLORS.length];
          return (
            <div
              key={trip.id}
              className="flex items-center gap-3 p-3 mb-2 rounded-xl border"
              style={{
                borderColor: c + "33",
                background: c + "08",
              }}
            >
              <div
                onClick={() => {
                  setDetailTripId(trip.id);
                  setView("tripDetail");
                }}
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
              >
                <div
                  className="w-1.5 h-10 rounded-sm shrink-0"
                  style={{ background: c }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-800">
                    📍 {trip.destination}
                  </div>
                  <div className="text-xs text-gray-500">
                    {fmtDate(trip.startDate)} – {fmtDate(trip.endDate)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-gray-400">
                    {(trip.items || []).length} details
                  </div>
                  <div className="text-base text-gray-300">›</div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(trip.id);
                }}
                className="bg-transparent border-none cursor-pointer text-base p-1.5 shrink-0 text-slate-400"
              >
                🗑️
              </button>
            </div>
          );
        })
      )}
    </div>
  );

  // Trip detail view
  const renderTripDetail = () => {
    if (!detailTrip)
      return <p className="text-gray-400 p-5">Trip not found.</p>;
    const c = TRIP_COLORS[detailTrip.color % TRIP_COLORS.length];
    const items = [...(detailTrip.items || [])].sort((a, b) => {
      const dirOrd: Record<string, number> = { outbound: 0, return: 1 };
      if (a.type === b.type) {
        const da = a.direction ? dirOrd[a.direction] : 0;
        const db = b.direction ? dirOrd[b.direction] : 0;
        if (da !== db) return da - db;
      }
      return (a.date || "z").localeCompare(b.date || "z");
    });
    const grouped: Record<string, TripItem[]> = {};
    items.forEach((it) => {
      if (!grouped[it.type]) grouped[it.type] = [];
      grouped[it.type].push(it);
    });

    return (
      <div>
        <div
          className="p-4 rounded-xl mb-4 border"
          style={{
            background: c + "11",
            borderColor: c + "33",
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h2
                className="text-xl font-extrabold"
                style={{ color: c }}
              >
                📍 {detailTrip.destination}
              </h2>
              <div className="text-[13px] text-gray-500 mt-1">
                {fmtDate(detailTrip.startDate)} – {fmtDate(detailTrip.endDate)}
              </div>
              {detailTrip.notes && (
                <div className="text-xs text-gray-500 mt-1 italic">
                  {detailTrip.notes}
                </div>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => openEditTrip(detailTrip)}
                className="bg-white border border-gray-300 rounded-md px-2.5 py-1 text-xs cursor-pointer"
              >
                ✏️ Edit
              </button>
              <button
                onClick={() => setConfirmDelete(detailTrip.id)}
                className="bg-white border border-red-300 rounded-md px-2.5 py-1 text-xs cursor-pointer text-red-600"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {(Object.entries(ITEM_LABELS) as [ItemType, string][]).map(
            ([k, v]) => (
              <button
                key={k}
                onClick={() => {
                  setItemForm({
                    type: k,
                    date: "",
                    dateEnd: "",
                    details: "",
                    refNumber: "",
                    direction: "outbound",
                  });
                  setEditItemId(null);
                  setShowItemForm(true);
                }}
                className="flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-dashed border-gray-300 bg-white cursor-pointer text-[13px] font-semibold text-slate-600"
              >
                {ITEM_ICONS[k]} Add {v}
              </button>
            )
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 px-5 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-slate-200">
            <div className="text-[28px] mb-2">✈️ 🚄 🏨</div>
            <div className="text-sm">
              No details yet — add flights, trains, or hotels above
            </div>
          </div>
        ) : (
          (["flight", "train", "hotel", "other"] as ItemType[])
            .filter((t) => grouped[t])
            .map((type) => (
              <div key={type} className="mb-4">
                <h4 className="mb-1.5 text-[13px] font-bold text-slate-500">
                  {ITEM_ICONS[type]} {ITEM_LABELS[type]}s
                </h4>
                {grouped[type].map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center px-3 py-2.5 mb-1 rounded-lg bg-white border border-gray-200"
                  >
                    <div className="text-[13px] min-w-0 flex-1">
                      {(item.type === "flight" || item.type === "train") && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                            item.direction === "return"
                              ? "text-purple-600 bg-purple-50"
                              : "text-blue-600 bg-blue-100"
                          }`}
                        >
                          {item.direction === "return"
                            ? "↩ Return"
                            : "→ Outbound"}
                        </span>
                      )}
                      {item.refNumber && (
                        <strong className="mr-1.5">{item.refNumber}</strong>
                      )}
                      {item.details && (
                        <span className="text-gray-700">{item.details}</span>
                      )}
                      {item.date && (
                        <span className="text-gray-400 ml-1.5 text-[11px]">
                          {item.type === "hotel"
                            ? item.dateEnd
                              ? `${fmtDate(item.date)} → ${fmtDate(
                                  item.dateEnd
                                )}`
                              : `in: ${fmtDate(item.date)}`
                            : fmtDate(item.date)}
                        </span>
                      )}
                      {!item.refNumber && !item.details && (
                        <span className="text-gray-400">No details</span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => openEditItem(item)}
                        className="bg-transparent border-none cursor-pointer text-sm p-0.5"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deleteItem(detailTrip.id, item.id)}
                        className="bg-transparent border-none cursor-pointer text-sm p-0.5"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
        )}
      </div>
    );
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-2 py-3 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">
            🇪🇸 Madrid Sabbatical
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            2026–2027 · School calendar + travel planner
          </p>
        </div>
        <button
          onClick={() => {
            setTripForm({
              destination: "",
              startDate: "",
              endDate: "",
              notes: "",
              color: trips.length % TRIP_COLORS.length,
            });
            setEditTripId(null);
            setShowTripForm(true);
          }}
          className="bg-indigo-600 text-white border-none rounded-lg px-3.5 py-2 font-semibold text-[13px] cursor-pointer hover:bg-indigo-700 transition-colors"
        >
          + Add Trip
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3 border-b-2 border-slate-200">
        {(
          [
            ["calendar", "📅 Calendar"],
            ["trips", `📋 Trips (${trips.length})`],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            onClick={() => {
              setView(k);
              setSelectedDate(null);
            }}
            className={`px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer -mb-[2px] ${
              view === k || (view === "tripDetail" && k === "trips")
                ? "font-bold text-indigo-600 border-b-2 border-indigo-600"
                : "font-medium text-slate-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Back button for trip detail */}
      {view === "tripDetail" && (
        <button
          onClick={() => setView("trips")}
          className="bg-transparent border-none cursor-pointer text-[13px] text-indigo-600 font-semibold py-1 mb-2"
        >
          ← All Trips
        </button>
      )}

      {/* Toggle + Legend */}
      {view === "calendar" && (
        <div className="flex flex-col gap-2 mb-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setCalendarMode("all")}
                className={`px-3 py-1 text-[11px] font-semibold cursor-pointer border-none transition-colors ${
                  calendarMode === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                All Events
              </button>
              <button
                onClick={() => setCalendarMode("trips")}
                className={`px-3 py-1 text-[11px] font-semibold cursor-pointer border-none transition-colors ${
                  calendarMode === "trips"
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"
                }`}
              >
                ✈️ Trips Only
              </button>
            </div>
          </div>

          {/* Legend */}
          {calendarMode === "all" ? (
            <div className="flex gap-2.5 flex-wrap text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-green-50 border border-green-200" />{" "}
                Milestone
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-50 border border-red-200" />{" "}
                Holiday
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-yellow-50 border border-dashed border-yellow-300" />{" "}
                <em>Tentative</em>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-50 border border-orange-200" />{" "}
                Vacation
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300" />{" "}
                Trip
              </span>
            </div>
          ) : (
            <div className="flex gap-2.5 flex-wrap text-[11px] text-slate-500">
              Colored bars show your trips across the calendar
            </div>
          )}
        </div>
      )}

      {/* Views */}
      {view === "calendar" && renderCalendar()}
      {view === "trips" && renderTripsList()}
      {view === "tripDetail" && renderTripDetail()}

      {/* Trip Form Modal */}
      {showTripForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTripForm(false);
              setEditTripId(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-[400px] max-h-[85vh] overflow-y-auto">
            <h3 className="text-[17px] font-bold mb-3.5">
              {editTripId ? "Edit" : "New"} Trip
            </h3>
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Destination *
                </label>
                <input
                  value={tripForm.destination}
                  onChange={(e) =>
                    setTripForm((f) => ({ ...f, destination: e.target.value }))
                  }
                  placeholder="e.g. Porto, Lisbon, Paris…"
                  className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                    Leaving on *
                  </label>
                  <input
                    type="date"
                    value={tripForm.startDate}
                    onChange={(e) =>
                      setTripForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                    Back on *
                  </label>
                  <input
                    type="date"
                    value={tripForm.endDate}
                    onChange={(e) =>
                      setTripForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Color
                </label>
                <div className="flex gap-1.5">
                  {TRIP_COLORS.map((color, i) => (
                    <div
                      key={i}
                      onClick={() => setTripForm((f) => ({ ...f, color: i }))}
                      className={`w-6 h-6 rounded-full cursor-pointer ${
                        tripForm.color === i
                          ? "border-[3px] border-slate-800"
                          : "border-2 border-transparent"
                      }`}
                      style={{ background: color, boxSizing: "border-box" }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Notes
                </label>
                <textarea
                  value={tripForm.notes}
                  onChange={(e) =>
                    setTripForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Trip purpose, who's coming…"
                  rows={2}
                  className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px] resize-y"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={saveTrip}
                  className="flex-1 bg-indigo-600 text-white border-none rounded-lg py-2.5 font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors"
                >
                  {editTripId ? "Update" : "Create Trip"}
                </button>
                <button
                  onClick={() => {
                    setShowTripForm(false);
                    setEditTripId(null);
                  }}
                  className="flex-1 bg-slate-100 border-none rounded-lg py-2.5 font-semibold text-sm cursor-pointer text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Form Modal */}
      {showItemForm && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowItemForm(false);
              setEditItemId(null);
            }
          }}
        >
          <div className="bg-white rounded-2xl p-5 w-full max-w-[400px]">
            <h3 className="text-[17px] font-bold mb-3.5">
              {editItemId ? "Edit" : "Add"} Detail
            </h3>
            <div className="flex flex-col gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Type
                </label>
                <div className="flex gap-1.5 flex-wrap">
                  {(
                    Object.entries(ITEM_LABELS) as [ItemType, string][]
                  ).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setItemForm((f) => ({ ...f, type: k }))}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                        itemForm.type === k
                          ? "border-2 border-indigo-600 bg-indigo-50"
                          : "border border-gray-300 bg-white"
                      }`}
                    >
                      {ITEM_ICONS[k]} {v}
                    </button>
                  ))}
                </div>
              </div>
              {(itemForm.type === "flight" || itemForm.type === "train") && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                    Direction
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() =>
                        setItemForm((f) => ({ ...f, direction: "outbound" }))
                      }
                      className={`flex-1 py-2 rounded-md text-[13px] font-semibold cursor-pointer text-center ${
                        itemForm.direction === "outbound"
                          ? "border-2 border-blue-600 bg-blue-100 text-blue-600"
                          : "border border-gray-300 bg-white text-slate-600"
                      }`}
                    >
                      → Outbound
                    </button>
                    <button
                      onClick={() =>
                        setItemForm((f) => ({ ...f, direction: "return" }))
                      }
                      className={`flex-1 py-2 rounded-md text-[13px] font-semibold cursor-pointer text-center ${
                        itemForm.direction === "return"
                          ? "border-2 border-purple-600 bg-purple-50 text-purple-600"
                          : "border border-gray-300 bg-white text-slate-600"
                      }`}
                    >
                      ↩ Return
                    </button>
                  </div>
                </div>
              )}
              {itemForm.type === "hotel" ? (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Check-in
                    </label>
                    <input
                      type="date"
                      value={itemForm.date}
                      onChange={(e) =>
                        setItemForm((f) => ({ ...f, date: e.target.value }))
                      }
                      className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                      Check-out
                    </label>
                    <input
                      type="date"
                      value={itemForm.dateEnd}
                      onChange={(e) =>
                        setItemForm((f) => ({
                          ...f,
                          dateEnd: e.target.value,
                        }))
                      }
                      className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={itemForm.date}
                    onChange={(e) =>
                      setItemForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Ref # (flight number, train number, booking code)
                </label>
                <input
                  value={itemForm.refNumber}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, refNumber: e.target.value }))
                  }
                  placeholder="e.g. IB3456, AVE 02345, BKNG-7890"
                  className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-0.5">
                  Details
                </label>
                <input
                  value={itemForm.details}
                  onChange={(e) =>
                    setItemForm((f) => ({ ...f, details: e.target.value }))
                  }
                  placeholder="e.g. MAD→OPO dep 14:30, Hotel Flores check-in 15:00"
                  className="w-full px-2.5 py-2 rounded-md border border-slate-300 text-[13px]"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={saveItem}
                  className="flex-1 bg-indigo-600 text-white border-none rounded-lg py-2.5 font-bold text-sm cursor-pointer hover:bg-indigo-700 transition-colors"
                >
                  {editItemId ? "Update" : "Add"}
                </button>
                <button
                  onClick={() => {
                    setShowItemForm(false);
                    setEditItemId(null);
                  }}
                  className="flex-1 bg-slate-100 border-none rounded-lg py-2.5 font-semibold text-sm cursor-pointer text-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete &&
        (() => {
          const t = trips.find((x) => x.id === confirmDelete);
          return (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[300] p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] text-center">
                <div className="text-[28px] mb-2">🗑️</div>
                <h3 className="text-base font-bold mb-2">Delete trip?</h3>
                <p className="text-[13px] text-gray-500 mb-4">
                  &quot;{t?.destination}&quot; and all its details will be
                  permanently removed.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 bg-slate-100 border-none rounded-lg py-2.5 font-semibold text-sm cursor-pointer text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteTrip(confirmDelete)}
                    className="flex-1 bg-red-600 text-white border-none rounded-lg py-2.5 font-bold text-sm cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* Footer Note */}
      <div className="mt-4 p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
        ⚠️ <strong>Note:</strong> School dates from the official{" "}
        <em>Orden de la Consejera de Educación</em> (2026/2027). Infantil 2º
        ciclo + Primaria = Section 2.2.2. 2027 national/community/local holidays
        will be added once published.
      </div>
    </div>
  );
}
