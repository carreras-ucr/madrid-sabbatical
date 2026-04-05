export interface TripItem {
  id: string;
  type: "flight" | "train" | "hotel" | "other";
  direction?: "outbound" | "return";
  date: string;
  dateEnd?: string;
  refNumber: string;
  details: string;
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
