export interface TripItem {
  id: string;
  type: "flight" | "train" | "hotel" | "other";
  direction?: "outbound" | "continuing" | "return";
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

export interface TripStop {
  city: string;
  startDate: string;
  endDate: string;
}

export interface Trip {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string;
  color: number;
  items: TripItem[];
  tripType?: "single" | "multi";
  stops?: TripStop[];
}

export interface Visit {
  id: string;
  visitorName: string;
  startDate: string;
  endDate: string;
  notes: string;
  color: number;
}
