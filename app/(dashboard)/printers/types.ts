export type PrinterStatus = "working" | "not_working" | "unknown";
export type PrinterFilter = "all" | "working" | "not_working" | "needs_attention";

export interface Printer {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: PrinterStatus;
  last_updated: string; // ISO timestamp
  last_reported_by?: string;
  building: string;
  floor: string;
  printer_type: string;
}

export interface StatusReport {
  status: PrinterStatus;
  comment?: string;
}
