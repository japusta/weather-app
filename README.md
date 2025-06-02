Описание проекта
Приложение состоит из двух частей:

Бэкенд (Node.js + TypeScript)

Предоставляет HTTP-API по маршруту GET /api/weather?city={city}.

При первом запросе за 15 мин (TTL = 900 сек):

Вызывает геокодирующий сервис (Nominatim или Open-Meteo Geocoding) для получения координат latitude/longitude.

Запрашивает почасовой прогноз на 24 часа у Open-Meteo, используя полученные координаты.

Кэширует результат (Redis или in-memory) с TTL 15 минут.

При повторном запросе в течение 15 мин возвращает данные из кэша, без обращения к внешним API.

Логирует операции: MISS/HIT в кэше, запросы к внешним сервисам и т. д.

Фронтенд (TypeScript + Parcel + Chart.js + Leaflet)

Страница с картой Leaflet, автодополнением поиска городов, переключателем единиц (°C/°F), списком «Избранное» (сохраняется в localStorage).

При вводе города или клике по карте:

Делает запрос к бэкенду за почасовым прогнозом.

Получает текущую погоду (Open-Meteo), 3-дневный прогноз (Open-Meteo) и отображает график 24-часовой температуры (Chart.js).

Кликабельные карточки 3-дневного прогноза: при клике на любую карточку строится почасовой график именно для выбранной даты.

Технологический стек
Backend

Node.js (v16+ или выше)

TypeScript

Redis (для production-кэша) или in-memory (для локальной проверки)

Библиотека axios (или node-fetch) для HTTP-запросов к внешним API

Библиотека redis@4.x для работы с Redis

Optional: express или fastify (если используется HTTP-сервер)

Frontend

Parcel v2 (собирает TS → JS)

TypeScript

Chart.js (v4) + chartjs-adapter-date-fns

Leaflet (карта)

date-fns (для форматирования дат)

Минимальный CSS (flexbox, стилизация карточек, map-container и т.д.)

Установка и запуск (Backend)

git clone https://github.com/japusta/weather-app.git

cd weather-app/backend

npm install

 файл .env

 PORT=3000
# API-ключ, который будут передавать клиенты (заголовок x-api-key)
API_KEY=abcdefghijkl123456
REDIS_URL=redis://localhost:6379
CACHE_TTL_SEC=900
REDIS_PASSWORD=MySuperSecret
REDIS_USER=myuser
REDIS_USER_PASSWORD=userpass123

npm run dev

Запуск production-сборки

npm run build
npm run start

Для запуска Redis

cd backend

docker compose up

при желании можно заменить RedisCache на In-Memory-Cache в файле WeatherController.ts


Установка и запуск (Frontend)

cd weather-app/frontend

npm install

npm run dev

Запуск production-сборки

npm run build

npm run serve
