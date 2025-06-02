"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const node_cron_1 = __importDefault(require("node-cron"));
const dotenv_1 = __importDefault(require("dotenv"));
const ApiKeyAuth_1 = require("./services/ApiKeyAuth");
const WeatherController_1 = require("./controllers/WeatherController");
dotenv_1.default.config();
class App {
    constructor() {
        this.expressApp = (0, express_1.default)();
        this.auth = new ApiKeyAuth_1.ApiKeyAuth();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.setupCronJobs();
    }
    setupMiddleware() {
        this.expressApp.use((0, cors_1.default)());
        this.expressApp.use(express_1.default.json());
    }
    setupRoutes() {
        //чек работоспособносчти
        this.expressApp.get('/health', (_req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        const weatherController = new WeatherController_1.WeatherController(this.auth);
        weatherController.register(this.expressApp);
    }
    setupErrorHandling() {
        //middleware-обработчик ошибок
        this.expressApp.use((err, _req, res, _next) => {
            console.error('Controller Error:', err);
            res
                .status(err.status || 500)
                .json({ error: err.message || 'Internal Server Error' });
        });
    }
    setupCronJobs() {
        //каждый день в 00:00 чистим старые записи
        const ttl = parseInt(process.env.CACHE_TTL_SEC || '900', 10);
        node_cron_1.default.schedule('0 0 * * *', () => {
            console.log(`Cron job triggered: можно тут вставить вызов purgeOldFiles.`);
        });
    }
    start() {
        const port = process.env.PORT || 3000;
        this.expressApp.listen(port, () => console.log(`Listening on http://localhost:${port}`));
    }
}
exports.App = App;
