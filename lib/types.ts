export interface TripItem {
  id: string;
  type: "flight" | "train" | "hotel" | "other";
  direction?: "outbound" | "return";
  date: string;
  dateEnd?: string;
  refNumber: string;
  details: string;
  // Hotel fields
  hotelName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  // Flight fields
  airline?: string;
  flightNumber?: string;
  departureTime?: string;
  arrivalTime?: string;
  bookedWith?: string;
  ticketMiguel?: string;
  ticketYasemin?: string;
  ticketLara?: string;
  ticketMateo?: string;
  // Attachments
  attachments?: { url: string; filename: string; uploadedAt: string }[];
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  color: number;
  items: TripItem[];
}

export interface Visit {
  id: string;
  visitorName: string;
  startDate: string;
  endDate: string;
  notes: string;
  color: number;
}
