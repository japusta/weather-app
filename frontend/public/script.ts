
/**
 * ИЗНАЧАЛЬНО ВСЁ БЫЛО В ОДНОМ ФАЙЛЕ
 */

// import { Chart, ChartConfiguration, registerables } from 'chart.js';
// import 'chartjs-adapter-date-fns';
// import L from 'leaflet';

// Chart.register(...registerables);

// /**
//  * ApiClient для общения с бэкендом (24-часовой прогноз по названию города)
//  */
// class ApiClient {
//   private baseUrl = 'http://localhost:3000/api/weather';
//   private apiKey = 'abcdefghijkl123456';

//   async fetchForecast(
//     cityName: string
//   ): Promise<{ time: string[]; temperature_2m: number[] }> {
//     const url = `${this.baseUrl}?city=${encodeURIComponent(cityName)}`;
//     const resp = await fetch(url, {
//       headers: {
//         'Content-Type': 'application/json',
//         'x-api-key': this.apiKey
//       }
//     });
//     if (!resp.ok) {
//       const payload = await resp.json().catch(() => null);
//       const msg =
//         payload && (payload as any).error
//           ? (payload as any).error
//           : `Error ${resp.status}`;
//       throw new Error(msg);
//     }
//     return resp.json();
//   }
// }

// /**
//  * GeoClient для геокодирования:
//  *  • searchCities(query) — поиск по имени (forward geocoding)
//  *  • getNearestCity(lat, lon) — обратное геокодирование через Nominatim
//  *  • fetch3DayForecast(lat, lon) — трёхдневный прогноз (без изменений)
//  */
// class GeoClient {
//   private searchUrl = 'https://geocoding-api.open-meteo.com/v1/search';

//   async searchCities(
//     query: string
//   ): Promise<Array<{ display: string; value: string; latitude: number; longitude: number }>> {
//     const url = `${this.searchUrl}?name=${encodeURIComponent(query)}&count=10`;
//     const resp = await fetch(url);
//     if (!resp.ok) {
//       return [];
//     }
//     const payload = await resp.json().catch(() => null);
//     if (!payload || !payload.results) {
//       return [];
//     }

//     const seen = new Set<string>();
//     const unique: Array<{ display: string; value: string; latitude: number; longitude: number }> = [];

//     for (const item of payload.results) {
//       const cityName: string = item.name;
//       if (!seen.has(cityName)) {
//         seen.add(cityName);
//         unique.push({
//           display: cityName,
//           value: cityName,
//           latitude: item.latitude,
//           longitude: item.longitude
//         });
//       }
//     }
//     return unique;
//   }

//   async getNearestCity(
//     lat: number,
//     lon: number
//   ): Promise<{ name: string; latitude: number; longitude: number }> {
//     const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
//     const resp = await fetch(url, {
//       headers: {
//         'User-Agent': 'MyWeatherApp/1.0 (example@example.com)'
//       }
//     });
//     if (!resp.ok) {
//       throw new Error(`Reverse geocoding (Nominatim) failed: ${resp.status}`);
//     }

//     const payload = await resp.json().catch(() => null);
//     if (!payload || !payload.address) {
//       throw new Error('Не удалось получить данные обратного геокодирования');
//     }

//     const addr = payload.address as Record<string, string | undefined>;
//     const cityName =
//       addr.city ||
//       addr.town ||
//       addr.village ||
//       addr.county ||
//       addr.state ||
//       addr.country;
//     if (!cityName) {
//       throw new Error('Название населённого пункта не найдено');
//     }

//     // Nominatim возвращает точные координаты, которые могут слегка отличаться
//     const resultLat = parseFloat(payload.lat);
//     const resultLon = parseFloat(payload.lon);

//     return {
//       name: cityName,
//       latitude: resultLat,
//       longitude: resultLon
//     };
//   }

//   async fetch3DayForecast(
//     lat: number,
//     lon: number
//   ): Promise<Array<{ date: string; temp_min: number; temp_max: number; weathercode: number }>> {
//     const url =
//       `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
//       `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=UTC`;
//     const resp = await fetch(url);
//     if (!resp.ok) {
//       throw new Error(`Ошибка при получении 3-дневного прогноза: ${resp.status}`);
//     }
//     const payload = await resp.json();
//     const dates: string[] = payload.daily.time;
//     const mins: number[] = payload.daily.temperature_2m_min;
//     const maxs: number[] = payload.daily.temperature_2m_max;
//     const codes: number[] = payload.daily.weathercode;

//     const result: Array<{ date: string; temp_min: number; temp_max: number; weathercode: number }> = [];
//     for (let i = 0; i < 3 && i < dates.length; i++) {
//       result.push({
//         date: dates[i],
//         temp_min: mins[i],
//         temp_max: maxs[i],
//         weathercode: codes[i]
//       });
//     }
//     return result;
//   }
// }

// /**
//  * Запрос почасового прогноза на заданную дату (yyyy-MM-dd).
//  * Возвращает массив { time, temp } с часовыми данными UTC.
//  */
// async function fetchHourlyForecastForDate(
//   lat: number,
//   lon: number,
//   date: string
// ): Promise<Array<{ time: string; temp: number }>> {
//   const url =
//     `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
//     `&hourly=temperature_2m&start_date=${date}&end_date=${date}&timezone=UTC`;
//   const resp = await fetch(url);
//   if (!resp.ok) {
//     throw new Error(`Ошибка при получении почасового прогноза: ${resp.status}`);
//   }
//   const payload = await resp.json();
//   const times: string[] = payload.hourly.time;               // ["2025-06-03T00:00", ...]
//   const temps: number[] = payload.hourly.temperature_2m;     // [11.3, ...]
//   const result: Array<{ time: string; temp: number }> = [];
//   for (let i = 0; i < times.length; i++) {
//     result.push({ time: times[i], temp: temps[i] });
//   }
//   return result;
// }

// /**
//  * WeatherChart — обёртка над Chart.js для почасового графика.
//  */
// class WeatherChart {
//   public chart: Chart<'line', number[], string>;

//   constructor(ctx: CanvasRenderingContext2D) {
//     const config: ChartConfiguration<'line', number[], string> = {
//       type: 'line',
//       data: {
//         labels: [],
//         datasets: [
//           {
//             label: 'Температура, °C',
//             data: [],
//             borderColor: '#4a90e2',
//             backgroundColor: 'rgba(74,144,226,0.2)',
//             borderWidth: 2,
//             pointRadius: 3,
//             tension: 0.3
//           }
//         ]
//       },
//       options: {
//         responsive: true,
//         maintainAspectRatio: false,
//         scales: {
//           x: {
//             type: 'time',
//             time: {
//               parser: "yyyy-MM-dd'T'HH:mm",
//               unit: 'hour',
//               displayFormats: {
//                 hour: 'HH:mm'
//               }
//             },
//             title: {
//               display: true,
//               text: 'Время (UTC)'
//             }
//           },
//           y: {
//             display: true,
//             title: {
//               display: true,
//               text: '°C'
//             }
//           }
//         },
//         plugins: {
//           tooltip: {
//             callbacks: {
//               label: (context) => {
//                 const value = context.parsed.y;
//                 return ` ${value}°`;
//               }
//             }
//           }
//         }
//       }
//     };

//     this.chart = new Chart(ctx, config);
//   }

//   updateData(timeArr: string[], tempArr: number[], unit: 'C' | 'F') {
//     // Конвертация, если Фаренгейт
//     const dataToPlot = tempArr.map((t) =>
//       unit === 'C' ? t : (t * 9) / 5 + 32
//     );
//     this.chart.data.labels = timeArr;
//     this.chart.data.datasets[0]!.data = dataToPlot;
//     this.chart.data.datasets[0]!.label =
//       unit === 'C' ? 'Температура, °C' : 'Температура, °F';
//     this.chart.options.scales!['y']!.title!.text = unit === 'C' ? '°C' : '°F';
//     this.chart.update();
//   }
// }

// /**
//  * Получение текущей погоды (температура, ветер, влажность) через Open-Meteo.
//  * Возвращает { temperature, windspeed, winddirection, humidity, weathercode }.
//  */
// async function fetchCurrentWeather(
//   lat: number,
//   lon: number
// ): Promise<{
//   temperature: number;
//   windspeed: number;
//   winddirection: number;
//   humidity: number;
//   weathercode: number;
// }> {
//   const url =
//     `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
//     `&current_weather=true&hourly=relativehumidity_2m&timezone=UTC`;
//   const resp = await fetch(url);
//   if (!resp.ok) {
//     throw new Error(`Ошибка при получении текущей погоды: ${resp.status}`);
//   }
//   const payload = await resp.json();

//   const cw = payload.current_weather;
//   const times: string[] = payload.hourly.time;
//   const humidities: number[] = payload.hourly.relativehumidity_2m;

//   const now = new Date();
//   const year = now.getUTCFullYear();
//   const month = String(now.getUTCMonth() + 1).padStart(2, '0');
//   const day = String(now.getUTCDate()).padStart(2, '0');
//   const hour = String(now.getUTCHours()).padStart(2, '0');
//   const currentLabel = `${year}-${month}-${day}T${hour}:00`;

//   const idx = times.indexOf(currentLabel);
//   const humidity = idx !== -1 ? humidities[idx] : NaN;

//   return {
//     temperature: cw.temperature,
//     windspeed: cw.windspeed,
//     winddirection: cw.winddirection,
//     humidity: humidity,
//     weathercode: cw.weathercode
//   };
// }

// /**
//  * Маппинг weathercode → иконка и текст (русский).
//  * Если код неизвестен, возвращаем дефолтный «—».
//  */
// function getWeatherIconAndText(code: number): { icon: string; text: string } {
//   if (code === 0) return { icon: '☀️', text: 'Ясно' };
//   if ([1, 2, 3].includes(code)) return { icon: '⛅', text: 'Малооблачно' };
//   if ([45, 48].includes(code)) return { icon: '🌫️', text: 'Туман' };
//   if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return { icon: '🌧️', text: 'Дождь' };
//   if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: '❄️', text: 'Снег' };
//   return { icon: '—', text: '—' };
// }

// /**
//  * Сохраняем и загружаем «Избранное» из localStorage.
//  */
// function loadFavorites(): string[] {
//   return JSON.parse(localStorage.getItem('favorites') || '[]');
// }
// function saveFavorites(favs: string[]) {
//   localStorage.setItem('favorites', JSON.stringify(favs));
// }
// function addFavorite(city: string) {
//   const favs = loadFavorites();
//   if (!favs.includes(city)) {
//     favs.unshift(city);
//     if (favs.length > 5) favs.pop(); // максимум 5
//     saveFavorites(favs);
//   }
// }
// function removeFavorite(city: string) {
//   let favs = loadFavorites();
//   favs = favs.filter((c) => c !== city);
//   saveFavorites(favs);
// }

// /**
//  * Основная логика после загрузки DOM.
//  */
// document.addEventListener('DOMContentLoaded', () => {
//   // Элементы страницы
//   const cityInput = document.getElementById('cityInput') as HTMLInputElement;
//   const dataList = document.getElementById('city-list') as HTMLDataListElement;
//   const fetchBtn = document.getElementById('fetchBtn') as HTMLButtonElement;
//   const errorMsg = document.getElementById('errorMsg') as HTMLDivElement;
//   const loadingDiv = document.getElementById('loading') as HTMLDivElement;
//   const chartContainer = document.getElementById('chartContainer') as HTMLDivElement;
//   const currentWeatherDiv = document.getElementById('currentWeather') as HTMLDivElement;
//   const dailyForecastDiv = document.getElementById('dailyForecast') as HTMLDivElement;
//   const favoritesDiv = document.getElementById('favorites') as HTMLDivElement;
//   const clearFavBtn = document.getElementById('clearFav') as HTMLButtonElement;
//   const canvas = document.getElementById('tempChart') as HTMLCanvasElement;
//   const ctx = canvas.getContext('2d')!;
//   const unitRadios = document.querySelectorAll('input[name="unit"]') as NodeListOf<HTMLInputElement>;
//   const mapContainer = document.getElementById('map') as HTMLDivElement;

//   // Объекты и состояния
//   const apiClient = new ApiClient();
//   const geoClient = new GeoClient();
//   const weatherChart = new WeatherChart(ctx);

//   type CityEntry = { display: string; value: string; latitude: number; longitude: number };
//   let lastSuggestions: CityEntry[] = [];
//   let currentUnit: 'C' | 'F' = 'C';

//   // Инициализация карты Leaflet
//   const map = L.map(mapContainer).setView([55.75, 37.61], 5);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//     attribution: '&copy; OpenStreetMap contributors'
//   }).addTo(map);

//   let marker: L.Marker | null = null;

//   // Обработчик клика по карте (reverse geocoding через Nominatim)
//   map.on('click', async (e: L.LeafletMouseEvent) => {
//     const lat = e.latlng.lat;
//     const lon = e.latlng.lng;

//     try {
//       showLoading();
//       hideError();
//       hideAllOutputs();

//       // 1) Обратное геокодирование
//       const nearest = await geoClient.getNearestCity(lat, lon);
//       const cityName = nearest.name;
//       const cityLat = nearest.latitude;
//       const cityLon = nearest.longitude;

//       // 2) Заполняем input и lastSuggestions
//       cityInput.value = cityName;
//       lastSuggestions = [
//         {
//           display: cityName,
//           value: cityName,
//           latitude: cityLat,
//           longitude: cityLon
//         }
//       ];

//       // 3) Центрируем карту и ставим/перемещаем маркер
//       map.setView([cityLat, cityLon], 8);
//       if (marker) {
//         marker.setLatLng([cityLat, cityLon]);
//       } else {
//         marker = L.marker([cityLat, cityLon]).addTo(map);
//       }

//       // 4) Загружаем и рисуем всю погоду
//       await fetchAndRender(lastSuggestions[0]);
//     } catch (err: any) {
//       showError(err.message || 'Ошибка при выборе города на карте');
//     } finally {
//       hideLoading();
//     }
//   });

//   // Обработчик автодополнения (input)
//   let geoTimeout: number | null = null;
//   cityInput.addEventListener('input', () => {
//     const query = cityInput.value.trim();
//     if (query.length < 2) {
//       dataList.innerHTML = '';
//       lastSuggestions = [];
//       return;
//     }
//     if (geoTimeout) clearTimeout(geoTimeout);
//     geoTimeout = window.setTimeout(async () => {
//       try {
//         const results = await geoClient.searchCities(query);
//         dataList.innerHTML = '';
//         lastSuggestions = results;
//         for (const item of results.slice(0, 10)) {
//           const opt = document.createElement('option');
//           opt.value = item.value;
//           opt.textContent = item.display;
//           dataList.append(opt);
//         }
//       } catch {
//         dataList.innerHTML = '';
//       }
//     }, 300);
//   });

//   // Переключатель единиц (C ↔ F)
//   unitRadios.forEach((radio) => {
//     radio.addEventListener('change', () => {
//       currentUnit = radio.value as 'C' | 'F';

//       // 1) Перерисовать график, если есть данные
//       const labels = weatherChart.chart.data.labels as string[];
//       const dataset = weatherChart.chart.data.datasets[0]!.data as number[];
//       if (labels.length && dataset.length) {
//         weatherChart.updateData(labels, dataset as number[], currentUnit);
//       }

//       // 2) Перерисовать «Текущую погоду» и 3-дневный прогноз, если они видимы
//       const cityName = cityInput.value.trim();
//       if (cityName && !currentWeatherDiv.classList.contains('hidden')) {
//         const matched = lastSuggestions.find((c) => c.value === cityName);
//         if (matched) {
//           renderCurrentWeather(matched.latitude, matched.longitude, matched.display);
//           render3DayForecast(matched.latitude, matched.longitude);
//         }
//       }
//     });
//   });

//   // Кнопка «Показать график» по названию города
//   fetchBtn.addEventListener('click', async () => {
//     const city = cityInput.value.trim();
//     hideError();
//     if (!city) {
//       showError('Пожалуйста, введите название города');
//       hideAllOutputs();
//       return;
//     }
//     const matched = lastSuggestions.find((c) => c.value === city);
//     if (!matched) {
//       showError('Город не найден в списке подсказок');
//       hideAllOutputs();
//       return;
//     }
//     try {
//       showLoading();
//       map.setView([matched.latitude, matched.longitude], 8);
//       if (marker) {
//         marker.setLatLng([matched.latitude, matched.longitude]);
//       } else {
//         marker = L.marker([matched.latitude, matched.longitude]).addTo(map);
//       }
//       await fetchAndRender(matched);
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       hideLoading();
//     }
//   });

//   // Кнопка «Очистить избранное»
//   clearFavBtn.addEventListener('click', () => {
//     localStorage.removeItem('favorites');
//     renderFavorites();
//   });

//   // При старте — загрузим избранное и подправим карту
//   renderFavorites();
//   map.invalidateSize();

//   // Вспомогательные функции ----------------------------------------------

//   function showLoading() {
//     loadingDiv.classList.remove('hidden');
//   }
//   function hideLoading() {
//     loadingDiv.classList.add('hidden');
//   }

//   function showError(msg: string) {
//     errorMsg.textContent = msg;
//     errorMsg.classList.remove('hidden');
//   }
//   function hideError() {
//     errorMsg.classList.add('hidden');
//   }

//   function hideAllOutputs() {
//     currentWeatherDiv.classList.add('hidden');
//     dailyForecastDiv.classList.add('hidden');
//     chartContainer.classList.add('hidden');
//   }

//   // Рендер текущей погоды
//   async function renderCurrentWeather(lat: number, lon: number, cityName: string) {
//     try {
//       const current = await fetchCurrentWeather(lat, lon);
//       const { icon, text } = getWeatherIconAndText(current.weathercode);

//       const tempToShow =
//         currentUnit === 'C'
//           ? current.temperature
//           : ((current.temperature * 9) / 5 + 32).toFixed(1);

//       const humidityToShow = isNaN(current.humidity) ? 'н/д' : current.humidity + '%';
//       const windspeedToShow = currentUnit === 'C'
//         ? `${current.windspeed} км/ч`
//         : `${(current.windspeed * 0.621371).toFixed(2)} миль/ч`;

//       currentWeatherDiv.innerHTML = `
//         <p><strong>Текущая погода для ${cityName} (UTC):</strong></p>
//         <p>${icon} ${text}</p>
//         <p>🌡 Температура: ${tempToShow}${currentUnit}</p>
//         <p>💧 Влажность: ${humidityToShow}</p>
//         <p>💨 Скорость ветра: ${windspeedToShow}</p>
//         <p>🧭 Направление ветра: ${current.winddirection}°</p>
//         <button id="addFav" class="fav-btn">⭐ В избранное</button>
//       `;
//       currentWeatherDiv.classList.remove('hidden');

//       const addFavBtn = document.getElementById('addFav') as HTMLButtonElement;
//       addFavBtn.addEventListener('click', () => {
//         addFavorite(cityName);
//         renderFavorites();
//       });
//     } catch (err: any) {
//       showError(`Не удалось получить текущую погоду: ${err.message}`);
//       currentWeatherDiv.classList.add('hidden');
//     }
//   }

//   // Рендер 3-дневного прогноза + навес клика на каждый день
//   async function render3DayForecast(lat: number, lon: number) {
//     try {
//       const data = await geoClient.fetch3DayForecast(lat, lon);
//       dailyForecastDiv.innerHTML = '';

//       data.forEach((day) => {
//         const dateObj = new Date(day.date);
//         const weekday = dateObj.toLocaleDateString('ru-RU', { weekday: 'short' });
//         const dayNum = String(dateObj.getUTCDate()).padStart(2, '0');
//         const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
//         const { icon, text } = getWeatherIconAndText(day.weathercode);

//         const tMin = currentUnit === 'C'
//           ? day.temp_min
//           : (day.temp_min * 9) / 5 + 32;
//         const tMax = currentUnit === 'C'
//           ? day.temp_max
//           : (day.temp_max * 9) / 5 + 32;

//         const card = document.createElement('div');
//         card.className = 'day-card';
//         card.innerHTML = `
//           <p><strong>${weekday} ${dayNum}.${month}</strong></p>
//           <p>${icon} ${text}</p>
//           <p>↑ ${Math.round(tMax)}${currentUnit} ↓ ${Math.round(tMin)}${currentUnit}</p>
//         `;

//         // При клике строим почасовой график для `day.date`
//         card.addEventListener('click', async () => {
//           try {
//             showLoading();
//             hideError();

//             const hourlyData = await fetchHourlyForecastForDate(lat, lon, day.date);
//             const timeArr = hourlyData.map((item) => item.time);
//             const tempArr = hourlyData.map((item) => item.temp);

//             weatherChart.updateData(timeArr, tempArr, currentUnit);
//             chartContainer.classList.remove('hidden');
//           } catch (err: any) {
//             showError(`Не удалось загрузить почасовой прогноз: ${err.message}`);
//           } finally {
//             hideLoading();
//           }
//         });

//         dailyForecastDiv.append(card);
//       });

//       dailyForecastDiv.classList.remove('hidden');
//     } catch (err: any) {
//       showError(`Не удалось получить прогноз на 3 дня: ${err.message}`);
//       dailyForecastDiv.classList.add('hidden');
//     }
//   }

//   // Рендер избранных городов (кнопки)
//   function renderFavorites() {
//     const favs = loadFavorites();
//     favoritesDiv.innerHTML = '';
//     if (favs.length === 0) {
//       clearFavBtn.classList.add('hidden');
//       return;
//     }
//     clearFavBtn.classList.remove('hidden');
//     favs.forEach((city) => {
//       const btn = document.createElement('button');
//       btn.className = 'fav-btn';
//       btn.textContent = city;
//       btn.addEventListener('click', async () => {
//         cityInput.value = city;
//         try {
//           showLoading();
//           const results = await geoClient.searchCities(city);
//           if (results.length > 0) {
//             const first = results[0];
//             lastSuggestions = results;
//             map.setView([first.latitude, first.longitude], 8);
//             if (marker) {
//               marker.setLatLng([first.latitude, first.longitude]);
//             } else {
//               marker = L.marker([first.latitude, first.longitude]).addTo(map);
//             }
//             await fetchAndRender(first);
//           }
//         } catch (err: any) {
//           showError(err.message);
//         } finally {
//           hideLoading();
//         }
//       });
//       favoritesDiv.append(btn);
//     });
//   }

//   /**
//    * Основная функция: когда у нас есть CityEntry (display, value, lat, lon),
//    * выполняем все шаги: текущая, 3-дневная, 24-часовая.
//    */
//   async function fetchAndRender(entry: CityEntry) {
//     hideError();

//     // 1) Текущая погода
//     await renderCurrentWeather(entry.latitude, entry.longitude, entry.display);

//     // 2) 3-дневный прогноз
//     await render3DayForecast(entry.latitude, entry.longitude);

//     // 3) 24-часовой прогноз с вашего бэкенда
//     const forecast = await apiClient.fetchForecast(entry.value);
//     const timeArr = forecast.time.slice(0, 24);
//     const tempArr = forecast.temperature_2m.slice(0, 24);
//     weatherChart.updateData(timeArr, tempArr, currentUnit);

//     // Показываем график (по умолчанию 24 часа)
//     chartContainer.classList.remove('hidden');

//     // 4) Добавляем в избранное
//     addFavorite(entry.display);
//     renderFavorites();
//   }
// });
