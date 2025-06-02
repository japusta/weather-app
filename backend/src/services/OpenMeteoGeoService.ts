// backend/src/services/OpenMeteoGeoService.ts

import axios from 'axios';
import { IGeoService } from './IGeoService';
import { GeocodeResult } from '../types/GeocodeResult';

/**
 * Реализация IGeoService для Open-Meteo Geocoding API.
 */
export class OpenMeteoGeoService implements IGeoService {
  private readonly url = 'https://geocoding-api.open-meteo.com/v1/search';

  public async getCoordinates(city: string): Promise<{ latitude: number; longitude: number }> {
    const resp = await axios.get<GeocodeResult>(this.url, {
      params: { name: city, count: 1 }
    });

    if (!resp.data.results || resp.data.results.length === 0) {
      throw new Error(`Not found coordinates for city: ${city}`);
    }

    const first = resp.data.results[0];
    return { latitude: first.latitude, longitude: first.longitude };
  }
}
