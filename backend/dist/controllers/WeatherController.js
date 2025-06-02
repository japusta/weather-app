"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeatherController = void 0;
// backend/src/controllers/WeatherController.ts
const express_1 = require("express");
const OpenMeteoGeoService_1 = require("../services/OpenMeteoGeoService");
const OpenMeteoWeatherService_1 = require("../services/OpenMeteoWeatherService");
const RedisCache_1 = require("../services/RedisCache");
const WeatherService_1 = require("../services/WeatherService");
class WeatherController {
    constructor(auth) {
        this.auth = auth;
        this.router = (0, express_1.Router)();
        this.geoService = new OpenMeteoGeoService_1.OpenMeteoGeoService();
        this.weatherApi = new OpenMeteoWeatherService_1.OpenMeteoWeatherService();
        // Если Redis запускается на дефолтном порту 6379, то:
        // 1) либо в .env у вас REDIS_URL=redis://localhost:6379
        // 2) либо используем MemoryCache для быстрого теста без Redis
        this.cache = new RedisCache_1.RedisCache(process.env.REDIS_URL);
        //МОЖНО ПОДКЛЮЧИТЬ КЭШИРОВАНИЕ В ПАМЯТИ ВМЕСТО REDIS'a
        // this.cache = new MemoryCache<{ time: string[]; temperature_2m: number[] }>();
        const ttl = parseInt(process.env.CACHE_TTL_SEC || '900', 10);
        this.weatherService = new WeatherService_1.WeatherService(this.geoService, this.weatherApi, this.cache, ttl);
        // **Очень важно**: здесь мы НЕ убираем auth.middleware!
        this.router.get('/weather', this.auth.middleware, this.handleGetForecast.bind(this));
    }
    async handleGetForecast(req, res, next) {
        const city = req.query.city?.trim();
        if (!city) {
            res.status(400).json({ error: 'City is required' });
            return;
        }
        try {
            const result = await this.weatherService.getForecastByCity(city);
            res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    register(app) {
        // Префикс '/api' и затем '/weather'
        app.use('/api', this.router);
    }
}
exports.WeatherController = WeatherController;
