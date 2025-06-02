/**
 * ответ от Open-Meteo Geocoding API
 * Поле resultsэто  массив объектов
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
