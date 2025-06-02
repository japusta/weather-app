/**
 * Формат ответа прогноза (Open-Meteo).
 * 
 * GET https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&hourly=temperature_2m
 */
 export interface WeatherForecast {

    hourly: {
      time: string[];              // массив меток времени типа "2023-07-25T10:00"
      temperature_2m: number[];    // массив температур
    };
  }