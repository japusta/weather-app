
import { CityEntry } from "./types.js";

export interface Forecast24h {
    time: string[];
    temperature_2m: number[];
}

/*
 * ApiClient отвечает только за получение 24-часового прогноза
 * по названию города через бэкенд (http://localhost:3000/api/weather)
 */
export class ApiClient {
    private baseUrl = "http://localhost:3000/api/weather";
    private apiKey = "abcdefghijkl123456";

    async fetchForecast(cityName: string): Promise<Forecast24h> {
        const url = `${this.baseUrl}?city=${encodeURIComponent(cityName)}`;
        const resp = await fetch(url, {
            headers: {
                "Content-Type": "application/json",
                "x-api-key": this.apiKey
            }
        });
        if (!resp.ok) {
            const payload = await resp.json().catch(() => null);
            const msg =
                payload && (payload as any).error
                    ? (payload as any).error
                    : `Error ${resp.status}`;
            throw new Error(msg);
        }
        return resp.json();
    }
}
