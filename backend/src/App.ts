// backend/src/App.ts

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { ApiKeyAuth } from './services/ApiKeyAuth';
import { WeatherController } from './controllers/WeatherController';

dotenv.config();

export class App {
  public expressApp: Express;
  private auth: ApiKeyAuth;

  constructor() {
    this.expressApp = express();
    this.auth = new ApiKeyAuth();

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    this.setupCronJobs();
  }

  private setupMiddleware(): void {
    this.expressApp.use(cors());
    this.expressApp.use(express.json());
  }

  private setupRoutes(): void {
    // Здоровье (health check)
    this.expressApp.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({ status: 'ok' });
    });

    // Регистрируем WeatherController
    const weatherController = new WeatherController(this.auth);
    weatherController.register(this.expressApp);
  }

  private setupErrorHandling(): void {
    // Общий middleware-обработчик ошибок
    this.expressApp.use(
      (err: any, _req: Request, res: Response, _next: NextFunction) => {
        console.error('Controller Error:', err);
        res
          .status(err.status || 500)
          .json({ error: err.message || 'Internal Server Error' });
      }
    );
  }

  private setupCronJobs(): void {
    // Пример: каждый день в 00:00 чистим старые записи (older than 30 days)
    const ttl = parseInt(process.env.CACHE_TTL_SEC || '900', 10);
    cron.schedule('0 0 * * *', () => {
      console.log(`Cron job triggered: можно тут вставить вызов purgeOldFiles.`);
      // Например: this.weatherService.purgeOldFiles(days);
    });
  }

  public start(): void {
    const port = process.env.PORT || 3000;
    this.expressApp.listen(port, () =>
      console.log(`Listening on http://localhost:${port}`)
    );
  }
}
