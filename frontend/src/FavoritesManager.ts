import { CityEntry } from "./types.js";
import { ApiClient } from "./ApiClient.js";
import { GeoClient } from "./GeoClient.js";
import { WeatherChart } from "./WeatherChart.js";
import { hideAllOutputs, showLoading, hideLoading, showError } from "./UiHelpers.js";
import L from "leaflet";

export function loadFavorites(): string[] {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
}

export function saveFavorites(favs: string[]) {
    localStorage.setItem("favorites", JSON.stringify(favs));
}

/**
 * добавляет город в избранное, если его там нет, вставляем в начало,
 * если их становится больше 5 то удаляем самый старый
 */
export function addFavorite(city: string) {
    const favs = loadFavorites();
    if (!favs.includes(city)) {
        favs.unshift(city);
        if (favs.length > 5) {
            favs.pop();
        }
        saveFavorites(favs);
    }
}

//удаляем город из избранного

export function removeFavorite(city: string) {
    let favs = loadFavorites();
    favs = favs.filter((c) => c !== city);
    saveFavorites(favs);
}

/**
 * рендерим избранные города
 */
export function renderFavorites(
    geoClient: GeoClient,
    apiClient: ApiClient,
    weatherChart: WeatherChart,
    marker: L.Marker | null,
    map: L.Map,
    lastSuggestions: CityEntry[],
    setLastSuggestions: (arr: CityEntry[]) => void,
    fetchAndRenderFn: (entry: CityEntry) => Promise<void>
) {
    const favoritesDiv = document.getElementById("favorites");
    const clearFavBtn = document.getElementById("clearFav");
    if (!favoritesDiv || !clearFavBtn) return;

    const favs = loadFavorites();
    favoritesDiv.innerHTML = "";

    if (favs.length === 0) {
        clearFavBtn.classList.add("hidden");
        return;
    }

    clearFavBtn.classList.remove("hidden");
    for (const city of favs) {
        const btn = document.createElement("button");
        btn.className = "fav-btn";
        btn.textContent = city;
        btn.addEventListener("click", async () => {
            // при клике заполняем input, делаем forward-geocoding => fetchAndRender
            const cityInput = document.getElementById("cityInput") as HTMLInputElement;
            if (cityInput) {
                cityInput.value = city;
            }
            try {
                showLoading();
                const results = await geoClient.searchCities(city);
                if (results.length > 0) {
                    const first = results[0];
                    setLastSuggestions(results);
                    map.setView([first.latitude, first.longitude], 8);
                    if (marker) {
                        marker.setLatLng([first.latitude, first.longitude]);
                    } else {
                        marker = L.marker([first.latitude, first.longitude]).addTo(map);
                    }
                    await fetchAndRenderFn(first);
                }
            } catch (err: any) {
                showError(err.message);
            } finally {
                hideLoading();
            }
        });
        favoritesDiv.append(btn);
    }
}
