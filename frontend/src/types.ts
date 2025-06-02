/**
 * хапись о городе (результат геокодирования)
 */
export interface CityEntry {
    display: string;      // имя
    value: string;        // значение передаваемое в API
    latitude: number;
    longitude: number;
}

/**
 * текущая погода (результат fetchCurrentWeather)
 */
export interface CurrentWeather {
    temperature: number;
    windspeed: number;
    winddirection: number;
    humidity: number;
    weathercode: number;
}

/**
 * почасовые данные для графика (результат fetchHourlyForecastForDate)
 */
export interface HourlyData {
    time: string;   // "YYYY-MM-DDTHH:00"
    temp: number;
}
