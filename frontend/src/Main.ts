import { ApiClient } from "./ApiClient";
import { GeoClient } from "./GeoClient";
import { WeatherChart } from "./WeatherChart";
import { showLoading, hideLoading, showError, hideError, hideAllOutputs } from "./UiHelpers";
import { loadFavorites, addFavorite, renderFavorites } from "./FavoritesManager";
import { CityEntry, HourlyData, CurrentWeather } from "./types";

declare const L: any; // Leaflet подключается через CDN и подлежит глобальной переменной L

/**
 * запрос почасового прогноза на конкретную дату (yyyy-MM-dd)
 * вернет  массив { time, temp }
 */
async function fetchHourlyForecastForDate(
    lat: number,
    lon: number,
    date: string
): Promise<HourlyData[]> {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m&start_date=${date}&end_date=${date}&timezone=UTC`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Ошибка при получении почасового прогноза: ${resp.status}`);
    }
    const payload = await resp.json();
    const times: string[] = payload.hourly.time;
    const temps: number[] = payload.hourly.temperature_2m;
    const result: HourlyData[] = [];
    for (let i = 0; i < times.length; i++) {
        result.push({ time: times[i], temp: temps[i] });
    }
    return result;
}

/**
 * получение текущей погоды (температура, ветер, влажность) через Open-Meteo
 */
async function fetchCurrentWeather(
    lat: number,
    lon: number
): Promise<CurrentWeather> {
    const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&current_weather=true&hourly=relativehumidity_2m&timezone=UTC`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`Ошибка при получении текущей погоды: ${resp.status}`);
    }
    const payload = await resp.json();

    const cw = payload.current_weather;
    const times: string[] = payload.hourly.time;
    const humidities: number[] = payload.hourly.relativehumidity_2m;

    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const day = String(now.getUTCDate()).padStart(2, "0");
    const hour = String(now.getUTCHours()).padStart(2, "0");
    const currentLabel = `${year}-${month}-${day}T${hour}:00`;

    const idx = times.indexOf(currentLabel);
    const humidity = idx !== -1 ? humidities[idx] : NaN;

    return {
        temperature: cw.temperature,
        windspeed: cw.windspeed,
        winddirection: cw.winddirection,
        humidity: humidity,
        weathercode: cw.weathercode
    };
}

/**
 * переводит weathercode => { icon, text }. Если код неизвестен, возвращает "—".
 */
function getWeatherIconAndText(code: number): { icon: string; text: string } {
    if (code === 0) return { icon: "☀️", text: "Ясно" };
    if ([1, 2, 3].includes(code)) return { icon: "⛅", text: "Малооблачно" };
    if ([45, 48].includes(code)) return { icon: "🌫️", text: "Туман" };
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code))
        return { icon: "🌧️", text: "Дождь" };
    if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️", text: "Снег" };
    return { icon: "—", text: "—" };
}

document.addEventListener("DOMContentLoaded", () => {
    const cityInput = document.getElementById("cityInput") as HTMLInputElement;
    const dataList = document.getElementById("city-list") as HTMLDataListElement;
    const fetchBtn = document.getElementById("fetchBtn") as HTMLButtonElement;
    const clearFavBtn = document.getElementById("clearFav") as HTMLButtonElement;
    const currentWeatherDiv = document.getElementById("currentWeather") as HTMLDivElement;
    const dailyForecastDiv = document.getElementById("dailyForecast") as HTMLDivElement;
    const chartContainer = document.getElementById("chartContainer") as HTMLDivElement;
    const canvas = document.getElementById("tempChart") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    const unitRadios = document.querySelectorAll('input[name="unit"]') as NodeListOf<HTMLInputElement>;
    const mapContainer = document.getElementById("map") as HTMLDivElement;

    //экземпляры клиентов и графика
    const apiClient = new ApiClient();
    const geoClient = new GeoClient();
    const weatherChart = new WeatherChart(ctx);

    //для автодополнения ввода
    let lastSuggestions: CityEntry[] = [];
    let currentUnit: "C" | "F" = "C";

    //инициализируем карту
    const map = L.map(mapContainer).setView([55.75, 37.61], 5);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    let marker: L.Marker | null = null;

    // ========================================================================
    //            1) обработчик клика по карте (reverse-geocoding)
    // ========================================================================
    map.on("click", async (e: L.LeafletMouseEvent) => {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        try {
            showLoading();
            hideError();
            hideAllOutputs();

            // 1.1) Обратное геокодирование, находим ближайший город
            const nearest = await geoClient.getNearestCity(lat, lon);
            const cityName = nearest.name;
            const cityLat = nearest.latitude;
            const cityLon = nearest.longitude;

            // 1.2) Заполняем input, lastSuggestions
            cityInput.value = cityName;
            lastSuggestions = [
                {
                    display: cityName,
                    value: cityName,
                    latitude: cityLat,
                    longitude: cityLon
                }
            ];

            // 1.3) центриурет карту и ставим/перемещаем маркер
            map.setView([cityLat, cityLon], 8);
            if (marker) {
                marker.setLatLng([cityLat, cityLon]);
            } else {
                marker = L.marker([cityLat, cityLon]).addTo(map);
            }

            // 1.4)загружает и рисуем всю погоду
            await fetchAndRender(lastSuggestions[0]);
        } catch (err: any) {
            showError(err.message || "Ошибка при выборе города на карте");
        } finally {
            hideLoading();
        }
    });

    // ========================================================================
    //          2)обработчик автодополнения (input по названию города)
    // ========================================================================
    let geoTimeout: number | null = null;
    cityInput.addEventListener("input", () => {
        const query = cityInput.value.trim();
        if (query.length < 2) {
            dataList.innerHTML = "";
            lastSuggestions = [];
            return;
        }
        if (geoTimeout) {
            clearTimeout(geoTimeout);
        }
        geoTimeout = window.setTimeout(async () => {
            try {
                const results = await geoClient.searchCities(query);
                dataList.innerHTML = "";
                lastSuggestions = results;
                for (const item of results.slice(0, 10)) {
                    const opt = document.createElement("option");
                    opt.value = item.value;
                    opt.textContent = item.display;
                    dataList.append(opt);
                }
            } catch {
                dataList.innerHTML = "";
            }
        }, 300);
    });

    // ========================================================================
    //             3)переключатель единиц температуры (°C <=> °F)
    // ========================================================================
    unitRadios.forEach((radio) => {
        radio.addEventListener("change", () => {
            currentUnit = radio.value as "C" | "F";

            // 3.1)перерисовать график если в нём уже есть данные
            const labels = weatherChart.chart.data.labels as string[];
            const dataset = weatherChart.chart.data.datasets[0]!.data as number[];
            if (labels.length && dataset.length) {
                weatherChart.updateData(labels, dataset as number[], currentUnit);
            }

            // 3.2)перерисовать текущую погоду и 3-дневный прогноз, если они видимы
            const cityName = cityInput.value.trim();
            if (cityName && !currentWeatherDiv.classList.contains("hidden")) {
                const matched = lastSuggestions.find((c) => c.value === cityName);
                if (matched) {
                    renderCurrentWeather(matched.latitude, matched.longitude, matched.display);
                    render3DayForecast(matched.latitude, matched.longitude);
                }
            }
        });
    });

    // ========================================================================
    //                  4)показать график 
    // ========================================================================
    fetchBtn.addEventListener("click", async () => {
        const city = cityInput.value.trim();
        hideError();
        if (!city) {
            showError("Пожалуйста, введите название города");
            hideAllOutputs();
            return;
        }
        const matched = lastSuggestions.find((c) => c.value === city);
        if (!matched) {
            showError("Город не найден в списке подсказок");
            hideAllOutputs();
            return;
        }
        try {
            showLoading();
            map.setView([matched.latitude, matched.longitude], 8);
            if (marker) {
                marker.setLatLng([matched.latitude, matched.longitude]);
            } else {
                marker = L.marker([matched.latitude, matched.longitude]).addTo(map);
            }
            await fetchAndRender(matched);
        } catch (err: any) {
            showError(err.message);
        } finally {
            hideLoading();
        }
    });

    // ========================================================================
    //                  5)кнопка очистить избранное
    // ========================================================================
    clearFavBtn.addEventListener("click", () => {
        localStorage.removeItem("favorites");
        renderFavorites(
            geoClient,
            apiClient,
            weatherChart,
            marker,
            map,
            lastSuggestions,
            (arr) => (lastSuggestions = arr),
            fetchAndRender
        );
    });

    // ========================================================================
    //                        отрисуем избранное и карту
    // ========================================================================
    renderFavorites(
        geoClient,
        apiClient,
        weatherChart,
        marker,
        map,
        lastSuggestions,
        (arr) => (lastSuggestions = arr),
        fetchAndRender
    );
    map.invalidateSize();

    // ========================================================================
    //                         вспомогательные функции
    // ========================================================================

    /**
     * Рендер текущей погоды
     */
    async function renderCurrentWeather(
        lat: number,
        lon: number,
        cityName: string
    ) {
        try {
            const current = await fetchCurrentWeather(lat, lon);
            const { icon, text } = getWeatherIconAndText(current.weathercode);

            const tempToShow =
                currentUnit === "C"
                    ? current.temperature
                    : ((current.temperature * 9) / 5 + 32).toFixed(1);

            const humidityToShow = isNaN(current.humidity) ? "н/д" : current.humidity + "%";
            const windspeedToShow =
                currentUnit === "C"
                    ? `${current.windspeed} км/ч`
                    : `${(current.windspeed * 0.621371).toFixed(2)} миль/ч`;

            currentWeatherDiv.innerHTML = `
        <p><strong>Текущая погода для ${cityName} (UTC):</strong></p>
        <p>${icon} ${text}</p>
        <p>🌡 Температура: ${tempToShow}${currentUnit}</p>
        <p>💧 Влажность: ${humidityToShow}</p>
        <p>💨 Скорость ветра: ${windspeedToShow}</p>
        <p>🧭 Направление ветра: ${current.winddirection}°</p>
        <button id="addFav" class="fav-btn">⭐ В избранное</button>
      `;
            currentWeatherDiv.classList.remove("hidden");

            // кнопка в избранное
            const addFavBtn = document.getElementById("addFav") as HTMLButtonElement;
            addFavBtn.addEventListener("click", () => {
                addFavorite(cityName);
                renderFavorites(
                    geoClient,
                    apiClient,
                    weatherChart,
                    marker,
                    map,
                    lastSuggestions,
                    (arr) => (lastSuggestions = arr),
                    fetchAndRender
                );
            });
        } catch (err: any) {
            showError(`Не удалось получить текущую погоду: ${err.message}`);
            currentWeatherDiv.classList.add("hidden");
        }
    }

    /**
     *рендер 3-дневного прогноза  и вешаем
     * клики на каждый день для построения почасового графика на выбранную дату (выбор карточки)
     */
    async function render3DayForecast(lat: number, lon: number) {
        try {
            const data = await geoClient.fetch3DayForecast(lat, lon);
            dailyForecastDiv.innerHTML = "";

            data.forEach((day) => {
                const dateObj = new Date(day.date);
                const weekday = dateObj.toLocaleDateString("ru-RU", { weekday: "short" });
                const dayNum = String(dateObj.getUTCDate()).padStart(2, "0");
                const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
                const { icon, text } = getWeatherIconAndText(day.weathercode);

                const tMin =
                    currentUnit === "C" ? day.temp_min : (day.temp_min * 9) / 5 + 32;
                const tMax =
                    currentUnit === "C" ? day.temp_max : (day.temp_max * 9) / 5 + 32;

                const card = document.createElement("div");
                card.className = "day-card";
                card.innerHTML = `
          <p><strong>${weekday} ${dayNum}.${month}</strong></p>
          <p>${icon} ${text}</p>
          <p>↑ ${Math.round(tMax)}${currentUnit} ↓ ${Math.round(tMin)}${currentUnit}</p>
        `;

                // при клике на карточку отправляем запрос почасового прогноза
                card.addEventListener("click", async () => {
                    try {
                        showLoading();
                        hideError();
                        const hourlyData = await fetchHourlyForecastForDate(lat, lon, day.date);
                        const timeArr = hourlyData.map((item) => item.time);
                        const tempArr = hourlyData.map((item) => item.temp);
                        weatherChart.updateData(timeArr, tempArr, currentUnit);
                        chartContainer.classList.remove("hidden");
                    } catch (err: any) {
                        showError(`Не удалось загрузить почасовой прогноз: ${err.message}`);
                    } finally {
                        hideLoading();
                    }
                });

                dailyForecastDiv.append(card);
            });

            dailyForecastDiv.classList.remove("hidden");
        } catch (err: any) {
            showError(`Не удалось получить прогноз на 3 дня: ${err.message}`);
            dailyForecastDiv.classList.add("hidden");
        }
    }

    /**
     * основаня функция,когда у нас есть CityEntry (display, value, lat, lon),
     * полностью рендерим:
     *  текущую погоду
     *  3-дневный прогноз
     *  24-часовой прогноз из вашего бэкенда
     *  включаем блок с графиком 
     *  заносим город в избранное и обновляем список
     */
    async function fetchAndRender(entry: CityEntry) {
        hideError();

        // Текущая погода
        await renderCurrentWeather(entry.latitude, entry.longitude, entry.display);

        // 3-дневный прогноз
        await render3DayForecast(entry.latitude, entry.longitude);

        // 24-часовой прогноз
        try {
            const forecast = await apiClient.fetchForecast(entry.value);
            const timeArr = forecast.time.slice(0, 24);
            const tempArr = forecast.temperature_2m.slice(0, 24);
            weatherChart.updateData(timeArr, tempArr, currentUnit);
            chartContainer.classList.remove("hidden");
        } catch (err: any) {
            showError(`Не удалось получить 24-часовой прогноз: ${err.message}`);
        }

        // добавляем в избранное и перечитываем список
        addFavorite(entry.display);
        renderFavorites(
            geoClient,
            apiClient,
            weatherChart,
            marker,
            map,
            lastSuggestions,
            (arr) => (lastSuggestions = arr),
            fetchAndRender
        );
    }
});
