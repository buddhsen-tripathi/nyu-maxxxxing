export type NoiseLevel = "silent" | "quiet" | "moderate" | "loud";

export type SpaceType =
  | "library"
  | "study_room"
  | "lounge"
  | "lab"
  | "outdoor"
  | "hidden_gem";

export type SpaceFilter =
  | "all"
  | "quiet"
  | "group"
  | "zoom"
  | "outdoor"
  | "hidden_gems"
  | "favorites";

export interface StudySpace {
  id: string;
  name: string;
  building: string;
  address: string;
  floor: string;
  latitude: number;
  longitude: number;
  noise: NoiseLevel;
  type: SpaceType;
  amenities: string[];
  hours: string;
  capacity: string;
  checkins: number;
  tip?: string;
  favorite: boolean;
  submittedBy?: string; // present for hidden gems
  bookingUrl?: string; // NYU LibCal / EMS booking link
}
