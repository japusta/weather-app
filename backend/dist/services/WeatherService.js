"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherService = void 0;
/**
 * WeatherService
 *  1) При первом запросе за 15 мин:
 *     - запрашивает координаты через IGeoService
 *     - запрашивает погоду через IWeatherApi
 *     - сохраняет результат в ICache
 *     - возвращает { time[], temperature_2m[] }
 *  2) Если в кеше есть данные (TTL не истёк) — возвращает из кеша, не дергая внешние API
 */
class WeatherService {
    constructor(geoService, weatherApi, cache, ttlSeconds) {
        this.geoService = geoService;
        this.weatherApi = weatherApi;
        this.cache = cache;
        this.ttlSeconds = ttlSeconds;
        this.cachePrefix = 'weather:';
    }
    async getForecastByCity(city) {
        const key = this.cachePrefix + city.toLowerCase();
        // 1) Пробуем взять из кеша
        const cached = await this.cache.get(key);
        if (cached) {
            console.log(`[WeatherService] CACHE HIT for city="${city}" (key="${key}")`);
            return cached;
        }
        console.log(`[WeatherService] CACHE MISS for city="${city}". Fetching from external services...`);
        // 2) Если в кеше нет — запрашиваем внешний API
        const { latitude, longitude } = await this.geoService.getCoordinates(city);
        console.log(`[WeatherService] Got coordinates for "${city}": lat=${latitude}, lon=${longitude}`);
        const hourly = await this.weatherApi.getHourlyForecast(latitude, longitude);
        console.log(`[WeatherService] Got hourly forecast for "${city}" (${hourly.time.length} points)`);
        // 3) Сохраняем в кеш
        await this.cache.set(key, hourly, this.ttlSeconds);
        console.log(`[WeatherService] Saved to cache (key="${key}", ttl=${this.ttlSeconds}s)`);
        return hourly;
    }
}
exports.WeatherService = WeatherService;
