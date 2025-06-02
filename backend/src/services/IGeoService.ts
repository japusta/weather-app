import { GeocodeResult } from '../types/GeocodeResult';

/**
 * IGeoService — абстракция слоя геокодинга.
 * Метод getCoordinates возвращает { latitude, longitude } для заданного города.
 */
export interface IGeoService {
  getCoordinates(city: string): Promise<{ latitude: number; longitude: number }>;
}
