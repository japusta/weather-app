
/**
 * Внешний API для получения прогноза погоды
 */
 export interface IWeatherApi {
  getHourlyForecast(latitude: number, longitude: number): Promise<{ time: string[]; temperature_2m: number[] }>;
}
