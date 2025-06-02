"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenMeteoWeatherService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * OpenMeteoWeatherService — реализация IWeatherApi через Open-Meteo Forecast API.
 */
class OpenMeteoWeatherService {
    constructor() {
        this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
    }
    async getHourlyForecast(latitude, longitude) {
        const resp = await axios_1.default.get(this.baseUrl, {
            params: {
                latitude,
                longitude,
                hourly: 'temperature_2m',
                timezone: 'UTC' // чтобы время было в UTC
            }
        });
        return resp.data;
    }
}
exports.OpenMeteoWeatherService = OpenMeteoWeatherService;
