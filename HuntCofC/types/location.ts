export interface LocationData {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  isEvent?: boolean;
  startTime?: string;
  duration?: number;
}

export interface NewLocation {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  eventDate: string;
  startTime: string;
  startPeriod: string;
  duration: string;
} 