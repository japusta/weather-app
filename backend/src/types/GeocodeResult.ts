// backend/src/types/GeocodeResult.ts

/**
 * Тип ответа от Open-Meteo Geocoding API.
 * Поле results — массив объектов, в котором нам интересны latitude, longitude.
 */
 export interface GeocodeResult {
  results: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    timezone: string;
  }>;
}
