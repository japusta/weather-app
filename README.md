Описание проекта

Приложение состоит из двух частей:

Бэкенд (Node.js + TypeScript)

Предоставляет HTTP-API по маршруту GET /api/weather?city={city}.

При первом запросе за 15 мин (TTL = 900 сек):

Вызывает геокодирующий сервис (Nominatim (для обратного геокодирования если выбираем город на карте кликом) или Open-Meteo Geocoding) для получения координат latitude/longitude.

Запрашивает почасовой прогноз на 24 часа у Open-Meteo, используя полученные координаты.

Кэширует результат (Redis или in-memory) с TTL 15 минут.

При повторном запросе в течение 15 мин возвращает данные из кэша, без обращения к внешним API.

Логирует операции: MISS/HIT в кэше, запросы к внешним сервисам и т. д.

Фронтенд (TypeScript + Parcel + Chart.js + Leaflet)

Страница с картой Leaflet, автодополнением поиска городов, переключателем единиц (°C/°F), списком "Избранное" (сохраняется в localStorage).

При вводе города или клике по карте:

Делает запрос к бэкенду за почасовым прогнозом.

Получает текущую погоду (Open-Meteo), 3-дневный прогноз (Open-Meteo) и отображает график 24-часовой температуры (Chart.js).

Кликабельные карточки 3-дневного прогноза: при клике на любую карточку строится почасовой график именно для выбранной даты.

стек

```Backend```

Node.js 

TypeScript

Redis (для production-кэша) или in-memory (для локальной проверки)

axios для HTTP-запросов к внешним API

Библиотека redis для работы с Redis



Frontend

Parcel (собирает TS → JS)

TypeScript

Chart.js (v4) + chartjs-adapter-date-fns

Leaflet (карта)

date-fns (для форматирования дат)

```Установка и запуск (Backend)```

git clone https://github.com/japusta/weather-app.git

cd weather-app/backend

npm install

заполнить файл .env (либо заполнить .env.example и переименовать его в .env)

PORT=3000
API-ключ, который будут передавать клиенты (заголовок x-api-key)
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

```Для запуска Redis```

cd backend

docker compose up

я работал на windows, предварительно перед командой запускал docker desktop

при желании можно заменить RedisCache на In-Memory-Cache в файле WeatherController.ts


```Установка и запуск (Frontend)```

cd weather-app/frontend

npm install

npm run dev

Запуск production-сборки

npm run build

npm run start

```ПРИМЕРЫ РАБОТЫ```

![{14AF227E-2B1C-4DDD-A352-0BD892449A26}](https://github.com/user-attachments/assets/2e164479-b03d-4e74-bb10-92727f89908d)

![{DA2ABF40-6FBF-44B7-8941-875B30ECBAA4}](https://github.com/user-attachments/assets/1c7cfaf1-15f9-44b4-822f-4f6acc219504)

![{B5E06E96-FEFC-4175-9A73-17957E723C22}](https://github.com/user-attachments/assets/f2687b98-20a0-41ea-948a-27b632eecb25)

![{C1503019-0815-4ED8-8AD7-AD35828ABD98}](https://github.com/user-attachments/assets/e55bc6ef-16f9-4edb-b974-d050302b6050)

Логи сервера, демонстрирующие что данные берутся из кэша при повторном выборе города, если мы уже искали погода для выбранного города

![{BD200AF9-6BDB-4D76-91B8-03F97D317E77}](https://github.com/user-attachments/assets/cd201e3c-0a61-4b14-a8ca-287449a890c6)

Смена единиц измерения температуры

![{DA34F498-97FF-40B3-8A0A-A3F1D71D8E6C}](https://github.com/user-attachments/assets/948b2726-e379-46e5-8898-3f396c509ef5)

Выбор города кликом по карте

![{1585C07B-D09B-4838-A55C-2A75CA5B3AF2}](https://github.com/user-attachments/assets/cf5dbf93-4f44-44b6-a5b9-6dc3a8afaa93)

