"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenMeteoWeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Реализация IWeatherApi
 * В ответ мы берём только поля hourly.time[] и hourly.temperature_2m[]
 */
class OpenMeteoWeatherService {
    constructor() {
        this.url = 'https://api.open-meteo.com/v1/forecast';
    }
    async getHourlyForecast(latitude, longitude) {
        // https://api.open-meteo.com/v1/forecast?latitude=55.75&longitude=37.61&hourly=temperature_2m&timezone=UTC
        const resp = await axios_1.default.get(this.url, {
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
exports.OpenMeteoWeatherService = OpenMeteoWeatherService;
