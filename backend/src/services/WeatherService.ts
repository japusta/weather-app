// backend/src/services/WeatherService.ts

import { IGeoService } from './IGeoService';
import { IWeatherApi } from './IWeatherApi';
import { ICache } from './ICache';
import { WeatherForecast } from '../types/WeatherForecast';

/**
 * WeatherService:
 *  1) При первом запросе за 15 мин: 
 *     - запрашивает координаты через IGeoService
 *     - запрашивает погоду через IWeatherApi
 *     - сохраняет результат в ICache
 *     - возвращает { time[], temperature_2m[] }
 *  2) Если в кеше есть данные (TTL не истёк) — возвращает из кеша, не дергая внешние API.
 */
export class WeatherService {
  private readonly cachePrefix = 'weather:';

  constructor(
    private geoService: IGeoService,
    private weatherApi: IWeatherApi,
    private cache: ICache<{ time: string[]; temperature_2m: number[] }>,
    private ttlSeconds: number
  ) {}

  public async getForecastByCity(city: string): Promise<{ time: string[]; temperature_2m: number[] }> {
    const key = this.cachePrefix + city.toLowerCase();
    // 1) Пробуем взять из кеша
    const cached = await this.cache.get(key);
    if (cached) {
      return cached;
    }

    // 2) Если в кеше нет — запрашиваем внешний API
    const { latitude, longitude } = await this.geoService.getCoordinates(city);
    const hourly = await this.weatherApi.getHourlyForecast(latitude, longitude);

    // 3) Сохраняем в кеш
    await this.cache.set(key, hourly, this.ttlSeconds);
    return hourly;
  }
}
