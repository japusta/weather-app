"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const WeatherController_1 = require("./controllers/WeatherController");
const ApiKeyAuth_1 = require("./services/ApiKeyAuth");
dotenv_1.default.config();
class App {
    constructor() {
        if (!process.env.API_KEY) {
            throw new Error('Не задан API_KEY в .env');
        }
        if (!process.env.REDIS_URL) {
            throw new Error('Не задан REDIS_URL в .env');
        }
        this.expressApp = (0, express_1.default)();
        this.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        this.setupMiddleware();
        this.setupControllers();
        this.setupErrorHandler();
        this.setupCron();
    }
    setupMiddleware() {
        this.expressApp.use((0, cors_1.default)());
        this.expressApp.use(express_1.default.json());
        // Сервим статические файлы для фронтенда (Chart.js)
        this.expressApp.use(express_1.default.static('public'));
    }
    setupControllers() {
        // Настраиваем аутентификацию
        const auth = new ApiKeyAuth_1.ApiKeyAuth();
        const weatherController = new WeatherController_1.WeatherController(auth);
        // Корневой префикс «/api»
        weatherController.register(this.expressApp);
    }
    setupErrorHandler() {
        // Всё, что не попало в контроллеры, возвращаем 404
        this.expressApp.use((req, res) => {
            res.status(404).json({ error: 'Not Found' });
        });
        // Глобальный обработчик ошибок
        this.expressApp.use((err, _req, res, _next) => {
            console.error('Error:', err);
            res
                .status(err.status || 500)
                .json({ error: err.message || 'Internal Server Error' });
        });
    }
    setupCron() {
        // Ежедневно в 00:00 очищаем старые ключи (при желании, 
        // можно реализовать логику удаления внутри RedisCache или добавлять метод purgeOldKeys() .
        // В текущей реализации этот блок можно оставить пустым или 
        // вызвать .purgeOldFiles по расписанию. 
        // Например, (если хотим очищать все кэши/статический TTL Redis сам удаляет просроченные):
        // cron.schedule('0 0 * * *', async () => { /* ничего не делаем, TTL автоматом */ });
    }
    start() {
        this.expressApp.listen(this.port, () => {
            console.log(`Server is listening on http://localhost:${this.port}`);
        });
    }
}
exports.App = App;
