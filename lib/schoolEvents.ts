export type SchoolEventType = "milestone" | "holiday" | "vacation" | "tentative";

export interface SchoolEvent {
  label: string;
  type: SchoolEventType;
}

const dk = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export const SCHOOL_EVENTS: Record<string, SchoolEvent> = {};

const add = (k: string, label: string, type: SchoolEventType) => {
  SCHOOL_EVENTS[k] = { label, type };
};

// School start/end
add(dk(2026, 8, 7), "🏫 School starts (Inf/Pri)", "milestone");
add(dk(2026, 8, 8), "🏫 School starts (Sec/Bach)", "milestone");
add(dk(2027, 5, 18), "🏫 Last day of school", "milestone");

// 2026 Holidays
add(dk(2026, 9, 12), "🇪🇸 Fiesta Nacional", "holiday");
add(dk(2026, 10, 2), "⛪ Todos los Santos", "holiday");
add(dk(2026, 10, 9), "👑 Almudena (local)", "holiday");
add(dk(2026, 11, 7), "📜 Puente Constitución", "holiday");
add(dk(2026, 11, 8), "✝️ Inmaculada", "holiday");

// Christmas: Dec 23 – Jan 8
for (let d = 23; d <= 31; d++) add(dk(2026, 11, d), "🎄 Navidad", "vacation");
for (let d = 1; d <= 8; d++) add(dk(2027, 0, d), "🎄 Navidad", "vacation");

// Carnaval
add(dk(2027, 1, 12), "🎭 Carnaval", "holiday");
add(dk(2027, 1, 15), "🎭 Carnaval", "holiday");

// Semana Santa
add(dk(2027, 2, 19), "🌿 Semana Santa", "vacation");
for (let d = 20; d <= 28; d++) add(dk(2027, 2, d), "🌿 Semana Santa", "vacation");
add(dk(2027, 2, 29), "🌿 Semana Santa", "vacation");

// 2027 tentative
add(dk(2027, 4, 3), "🏴 Com. Madrid (tent.)", "tentative");
