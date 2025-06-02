"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherController = void 0;
const express_1 = require("express");
const OpenMeteoGeoService_1 = require("../services/OpenMeteoGeoService");
const OpenMeteoWeatherService_1 = require("../services/OpenMeteoWeatherService");
const RedisCache_1 = require("../services/RedisCache");
const WeatherService_1 = require("../services/WeatherService");
/**
 * WeatherController — настраивает маршрут:
 * GET /weather?city={city}
 *
 * При первом запуске создаёт зависимости:
 *   geoService, weatherApi, cache, weatherService
 * и хранит их в полях экземпляра.
 */
class WeatherController {
    constructor(auth) {
        this.auth = auth;
        this.router = (0, express_1.Router)();
        // 1) Создаём конкретные реализации:
        this.geoService = new OpenMeteoGeoService_1.OpenMeteoGeoService();
        this.weatherApi = new OpenMeteoWeatherService_1.OpenMeteoWeatherService();
        // 2) Кэшируем прогнозы в Redis (URL берётся из env)
        const redisUrl = process.env.REDIS_URL;
        this.cache = new RedisCache_1.RedisCache(redisUrl);
        // 3) Сервис, объединяющий их
        this.weatherService = new WeatherService_1.WeatherService(this.geoService, this.weatherApi, this.cache);
        // 4) Роут: GET /weather?city=
        this.router.get('/weather', this.auth.middleware, // проверка x-api-key
        this.weatherHandler.bind(this));
    }
    /**
     * Регистрирует этот контроллер в приложении Express.
     * Пути внутри будут «/api» + «/weather».
     */
    register(app) {
        app.use('/api', this.router);
    }
    /**
     * Обработчик GET /api/weather?city={city}
     */
    async weatherHandler(req, res, next) {
        const city = (req.query.city || '').trim();
        if (!city) {
            res.status(400).json({ error: 'Missing "city" query parameter' });
            return;
        }
        try {
            // Получаем прогноз из WeatherService (внутри—cache+API)
            const forecast = await this.weatherService.getForecastByCity(city);
            // Отдаём JSON с полем hourly (time[], temperature_2m[])
            res.json(forecast.hourly);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.WeatherController = WeatherController;
