import axios from 'axios';
import { IWeatherApi } from './IWeatherApi';
import { WeatherForecast } from '../types/WeatherForecast';

/**
 * Реализация IWeatherApi
 * В ответ мы берём только поля hourly.time[] и hourly.temperature_2m[]
 */
export class OpenMeteoWeatherService implements IWeatherApi {
  private readonly url = 'https://api.open-meteo.com/v1/forecast';

  public async getHourlyForecast(latitude: number, longitude: number): Promise<{ time: string[]; temperature_2m: number[] }> {

    // https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&hourly=temperature_2m&timezone=UTC
    const resp = await axios.get<WeatherForecast>(this.url, {
      params: {
        latitude,
        longitude,
        hourly: 'temperature_2m',
        timezone: 'UTC'
      }
    });

    if (!resp.data.hourly || !resp.data.hourly.time || !resp.data.hourly.temperature_2m) {
      throw new Error('Invalid weather data from Open-Meteo');
    }

    return {
      time: resp.data.hourly.time,
      temperature_2m: resp.data.hourly.temperature_2m
    };
  }
}
