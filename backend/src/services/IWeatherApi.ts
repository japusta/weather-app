// backend/src/services/IWeatherApi.ts

/**
 * Внешний API для получения прогноза погоды.
 * Метод getHourlyForecast принимает latitude и longitude и возвращает массивы time[] и temperature_2m[] за ближайшие N часов.
 */
 export interface IWeatherApi {
  getHourlyForecast(latitude: number, longitude: number): Promise<{ time: string[]; temperature_2m: number[] }>;
}
