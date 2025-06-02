"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenMeteoGeoService = void 0;
const axios_1 = __importDefault(require("axios"));
/**
 * Реализация IGeoService для Open-Meteo Geocoding API
 */
class OpenMeteoGeoService {
    constructor() {
        this.url = 'https://geocoding-api.open-meteo.com/v1/search';
    }
    async getCoordinates(city) {
        const resp = await axios_1.default.get(this.url, {
            params: { name: city, count: 1 }
        });
        if (!resp.data.results || resp.data.results.length === 0) {
            throw new Error(`Not found coordinates for city: ${city}`);
        }
        const first = resp.data.results[0];
        return { latitude: first.latitude, longitude: first.longitude };
    }
}
exports.OpenMeteoGeoService = OpenMeteoGeoService;
