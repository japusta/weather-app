import { CityEntry } from "./types.js";

/*
 * GeoClient отвечает за всё что связано с геоданными:
 * searchCities(query)   поиск города (forward-geocoding) через Open-Meteo Geocoding API
 * getNearestCity(lat, lon)  обратное геокодирование через Nominatim
 * fetch3DayForecast(lat, lon)  3-дневный прогноз через Open-Meteo API
 */
export class GeoClient {
    private searchUrl = "https://geocoding-api.open-meteo.com/v1/search";

    /*
     * поиск городов по имени (до 10 результатов)
     * на выходе вернем неповторяющийся список { display, value, latitude, longitude }
     */
    async searchCities(
        query: string
    ): Promise<Array<{ display: string; value: string; latitude: number; longitude: number }>> {
        const url = `${this.searchUrl}?name=${encodeURIComponent(query)}&count=10`;
        const resp = await fetch(url);
        if (!resp.ok) {
            return [];
        }
        const payload = await resp.json().catch(() => null);
        if (!payload || !payload.results) {
            return [];
        }

        const seen = new Set<string>();
        const unique: Array<{ display: string; value: string; latitude: number; longitude: number }> = [];

        for (const item of payload.results) {
            const cityName: string = item.name;
            if (!seen.has(cityName)) {
                seen.add(cityName);
                unique.push({
                    display: cityName,
                    value: cityName,
                    latitude: item.latitude,
                    longitude: item.longitude
                });
            }
        }
        return unique;
    }

    /*
     * обратное геокодирование: по координатам (lat, lon) получить ближайший город (при клике по карте)
     * используется Nominatim (OpenStreetMap)
     * возвращает { name, latitude, longitude } 
     */
    async getNearestCity(
        lat: number,
        lon: number
    ): Promise<{ name: string; latitude: number; longitude: number }> {
        // Добавляем &accept-language=en — заставляем Nominatim вернуть англоязычные названия
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=en`;
        const resp = await fetch(url, {
            headers: {
                // Обязательно указываем корректный User-Agent (Nominatim просит об этом)
                "User-Agent": "MyWeatherApp/1.0 (example@example.com)"
            }
        });
        if (!resp.ok) {
            throw new Error(`Reverse geocoding (Nominatim) failed: ${resp.status}`);
        }

        const payload = await resp.json().catch(() => null);
        if (!payload || !payload.address) {
            throw new Error("Не удалось получить данные обратного геокодирования");
        }

        // Теперь payload.address.city (или .town/.village и т.д.) будет уже на английском
        const addr = payload.address as Record<string, string | undefined>;
        const cityName =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.county ||
            addr.state ||
            addr.country;
        if (!cityName) {
            throw new Error("Название населённого пункта не найдено");
        }

        const resultLat = parseFloat(payload.lat);
        const resultLon = parseFloat(payload.lon);

        return {
            name: cityName,
            latitude: resultLat,
            longitude: resultLon
        };
    }

    /*
     * 3-дневный прогноз через Open-Meteo
     * вернет массив из 3 объектов { date: string, temp_min, temp_max, weathercode }
     */
    async fetch3DayForecast(
        lat: number,
        lon: number
    ): Promise<Array<{ date: string; temp_min: number; temp_max: number; weathercode: number }>> {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
            `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=UTC`;
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Ошибка при получении 3-дневного прогноза: ${resp.status}`);
        }
        const payload = await resp.json();
        const dates: string[] = payload.daily.time;
        const mins: number[] = payload.daily.temperature_2m_min;
        const maxs: number[] = payload.daily.temperature_2m_max;
        const codes: number[] = payload.daily.weathercode;

        const result: Array<{ date: string; temp_min: number; temp_max: number; weathercode: number }> = [];
        for (let i = 0; i < 3 && i < dates.length; i++) {
            result.push({
                date: dates[i],
                temp_min: mins[i],
                temp_max: maxs[i],
                weathercode: codes[i]
            });
        }
        return result;
    }
}
