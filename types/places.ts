export interface NearbyPlaceLocation {
  latitude: number;
  longitude: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  address: string | null;
  rating: number | null;
  reviewsCount: number | null;
  categories: string[];
  location: NearbyPlaceLocation | null;
  url: string | null;
  priceLevel: string | null;
  openingHours: string | null;
}

export interface FetchNearbyPlacesInput {
  latitude: number;
  longitude: number;
  query?: string;
  radiusKm?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface FetchNearbyPlacesResponse {
  places: NearbyPlace[];
  query: string;
  radiusKm: number;
}
